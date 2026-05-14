-- Focus Groups MVP: persisted multi-round persona debates.
-- Three concerns:
--   1) New parent table `focus_group_sessions` (participants list + topic + counters).
--   2) Tagging columns on `chat_results` so per-participant responses appear in chat history.
--   3) Atomic per-round credit charging via dedicated RPC + idempotency ledger
--      (separate path from the per-row trigger and the per-merge thread RPC).

-- 1) Parent table -----------------------------------------------------------

create table if not exists public.focus_group_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid references public.users (id) on delete set null,
  participants jsonb not null default '[]'::jsonb,
  country_context text not null default 'both'
    check (country_context in ('uk', 'ksa', 'both')),
  initial_topic text not null,
  round_count integer not null default 0 check (round_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists focus_group_sessions_project_id_created_at_idx
  on public.focus_group_sessions (project_id, created_at desc);

create index if not exists focus_group_sessions_org_id_project_id_idx
  on public.focus_group_sessions (organization_id, project_id);

comment on table public.focus_group_sessions is
  'Active and historical focus-group sessions (2-4 segments) scoped by project + organization.';

comment on column public.focus_group_sessions.participants is
  'JSON array of participant snapshots ({ id, segment_id, name, color_token, country }) captured at start.';

comment on column public.focus_group_sessions.country_context is
  'Country lens carried into every round brief: uk, ksa, or both.';

comment on column public.focus_group_sessions.round_count is
  'Number of rounds executed so far. Bumped client-side on successful round persistence.';

create or replace function public.set_focus_group_sessions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_focus_group_sessions_updated_at on public.focus_group_sessions;
create trigger trg_focus_group_sessions_updated_at
before update on public.focus_group_sessions
for each row
execute function public.set_focus_group_sessions_updated_at();

alter table public.focus_group_sessions enable row level security;

drop policy if exists focus_group_sessions_select_visible on public.focus_group_sessions;
create policy focus_group_sessions_select_visible
on public.focus_group_sessions
for select
to authenticated
using (public.auth_user_can_read_project(project_id));

drop policy if exists focus_group_sessions_insert_visible on public.focus_group_sessions;
create policy focus_group_sessions_insert_visible
on public.focus_group_sessions
for insert
to authenticated
with check (
  public.auth_user_can_read_project(project_id)
  and organization_id = (select p.organization_id from public.projects p where p.id = project_id)
  and created_by = auth.uid()
);

drop policy if exists focus_group_sessions_update_owner_or_admin on public.focus_group_sessions;
create policy focus_group_sessions_update_owner_or_admin
on public.focus_group_sessions
for update
to authenticated
using (
  public.auth_user_can_read_project(project_id)
  and (created_by = auth.uid() or public.is_dashboard_admin())
)
with check (
  public.auth_user_can_read_project(project_id)
  and organization_id = (select p.organization_id from public.projects p where p.id = project_id)
  and (created_by = auth.uid() or public.is_dashboard_admin())
);

drop policy if exists focus_group_sessions_delete_owner_or_admin on public.focus_group_sessions;
create policy focus_group_sessions_delete_owner_or_admin
on public.focus_group_sessions
for delete
to authenticated
using (
  public.auth_user_can_read_project(project_id)
  and (created_by = auth.uid() or public.is_dashboard_admin())
);

grant select, insert, update, delete on public.focus_group_sessions to authenticated;

-- 2) chat_results tagging columns ------------------------------------------

alter table public.chat_results
  add column if not exists focus_group_session_id uuid
    references public.focus_group_sessions (id) on delete set null,
  add column if not exists focus_group_round_number integer
    check (focus_group_round_number is null or focus_group_round_number >= 1),
  add column if not exists focus_group_participant_index integer
    check (focus_group_participant_index is null or focus_group_participant_index >= 0);

comment on column public.chat_results.focus_group_session_id is
  'Set on per-participant focus-group response rows; groups rows under a focus_group_sessions parent.';

comment on column public.chat_results.focus_group_round_number is
  '1-based round number for focus-group response rows.';

comment on column public.chat_results.focus_group_participant_index is
  '0-based index within the round (speaking order) for focus-group response rows.';

create index if not exists chat_results_focus_group_session_round_idx
  on public.chat_results (focus_group_session_id, focus_group_round_number, focus_group_participant_index)
  where focus_group_session_id is not null;

-- Extend the chat_context_mode check constraint to allow 'focus_group'.
-- Existing constraint name set in 202605072345_chat_results_context_mode.sql.
alter table public.chat_results
  drop constraint if exists chat_results_context_mode_check;

alter table public.chat_results
  add constraint chat_results_context_mode_check
  check (chat_context_mode in ('default', 'persona_segment', 'custom_audience', 'focus_group'));

-- 3) Per-row credit trigger must skip focus-group rows ---------------------

create or replace function public.chat_results_apply_project_credit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  billable boolean;
  was_billable boolean;
begin
  -- Focus-group response rows are charged up-front per round via
  -- apply_project_credit_for_focus_group_round, so this trigger must not
  -- charge them again. Their credits_charged column stays at 0.
  if new.focus_group_session_id is not null then
    return new;
  end if;

  billable := new.status in ('complete', 'error_fallback')
    and new.project_id is not null
    and new.user_id is not null;

  was_billable := tg_op = 'update'
    and old.status in ('complete', 'error_fallback');

  if billable
     and coalesce(new.credits_charged, 0) = 0
     and not was_billable
  then
    update public.projects
    set
      used_credits = used_credits + 1,
      credit_balance = greatest(0, credit_balance - 1),
      updated_at = now()
    where id = new.project_id;

    new.credits_charged := 1;
  end if;

  return new;
end;
$$;

comment on function public.chat_results_apply_project_credit() is
  'First billable transition: +1 to projects unless the row is a focus-group response (which is pre-charged per round). Follow-up turns use apply_project_credit_for_thread_merge.';

-- 4) Per-round credit ledger + RPC -----------------------------------------

create table if not exists public.focus_group_round_credit_charges (
  round_request_id uuid primary key,
  focus_group_session_id uuid references public.focus_group_sessions (id) on delete set null,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  participant_count integer not null check (participant_count between 2 and 4),
  charged_amount integer not null check (charged_amount > 0),
  charged_at timestamptz not null default now()
);

create index if not exists focus_group_round_credit_charges_project_id_idx
  on public.focus_group_round_credit_charges (project_id);

create index if not exists focus_group_round_credit_charges_session_id_idx
  on public.focus_group_round_credit_charges (focus_group_session_id);

comment on table public.focus_group_round_credit_charges is
  'Idempotency ledger for atomic per-round charges (one row per round_request_id; charged_amount = 2 * participants).';

alter table public.focus_group_round_credit_charges enable row level security;

-- No policies: only the SECURITY DEFINER RPC and the service role touch this table.

create or replace function public.apply_project_credit_for_focus_group_round(
  p_round_request_id uuid,
  p_session_id uuid,
  p_project_id uuid,
  p_participant_count integer,
  out charged_amount integer,
  out credit_balance integer,
  out idempotent boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_charge_amount integer;
  v_current_balance integer;
  v_inserted integer;
  v_existing_amount integer;
begin
  if p_round_request_id is null
     or p_project_id is null
     or p_participant_count is null then
    raise exception 'round_request_id, project_id and participant_count are required.';
  end if;

  if p_participant_count < 2 or p_participant_count > 4 then
    raise exception 'participant_count must be between 2 and 4 (got %).', p_participant_count;
  end if;

  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authenticated user required to charge focus-group round.';
  end if;

  if not public.auth_user_can_read_project(p_project_id) then
    raise exception 'User % cannot access project %.', v_user_id, p_project_id;
  end if;

  v_charge_amount := 2 * p_participant_count;

  -- Idempotent insert keyed by round_request_id.
  insert into public.focus_group_round_credit_charges (
    round_request_id,
    focus_group_session_id,
    project_id,
    user_id,
    participant_count,
    charged_amount
  )
  values (
    p_round_request_id,
    p_session_id,
    p_project_id,
    v_user_id,
    p_participant_count,
    v_charge_amount
  )
  on conflict (round_request_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    -- Replay: return the charge that was already recorded.
    select c.charged_amount
    into v_existing_amount
    from public.focus_group_round_credit_charges c
    where c.round_request_id = p_round_request_id;

    select p.credit_balance
    into v_current_balance
    from public.projects p
    where p.id = p_project_id;

    charged_amount := v_existing_amount;
    credit_balance := v_current_balance;
    idempotent := true;
    return;
  end if;

  -- New charge: ensure project has enough balance, then deduct atomically.
  -- Qualify every column reference because the OUT parameter `credit_balance`
  -- shares its name with the projects column (would otherwise raise
  -- "column reference 'credit_balance' is ambiguous").
  update public.projects as p
  set
    used_credits = p.used_credits + v_charge_amount,
    credit_balance = p.credit_balance - v_charge_amount,
    updated_at = now()
  where p.id = p_project_id
    and p.credit_balance >= v_charge_amount
  returning p.credit_balance into v_current_balance;

  if v_current_balance is null then
    -- Raising rolls back the ledger insert with the rest of the function's work,
    -- so the same round_request_id can be retried once the project is topped up.
    raise exception 'INSUFFICIENT_CREDITS'
      using errcode = 'P0001';
  end if;

  -- Bump round_count on the parent session for convenience (best-effort).
  if p_session_id is not null then
    update public.focus_group_sessions
    set round_count = round_count + 1
    where id = p_session_id;
  end if;

  charged_amount := v_charge_amount;
  credit_balance := v_current_balance;
  idempotent := false;
end;
$$;

comment on function public.apply_project_credit_for_focus_group_round(uuid, uuid, uuid, integer) is
  'Atomic per-round focus-group credit charge (2 * participants). Idempotent on round_request_id. Raises INSUFFICIENT_CREDITS when balance is too low.';

revoke all on function public.apply_project_credit_for_focus_group_round(uuid, uuid, uuid, integer) from public;
grant execute on function public.apply_project_credit_for_focus_group_round(uuid, uuid, uuid, integer) to authenticated, service_role;
