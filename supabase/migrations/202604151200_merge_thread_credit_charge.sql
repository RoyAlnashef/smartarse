-- Follow-up turns merge into the thread anchor row; the first-turn trigger does not run again.
-- Charge one credit per completed merge via idempotent RPC (see chat_merge_credit_charges).
-- Dual-path billing: chat_results_apply_project_credit (first terminal completion per row) +
-- apply_project_credit_for_thread_merge (each completed follow-up merge).

comment on function public.chat_results_apply_project_credit() is
  'First billable transition on a row: increment projects + set credits_charged=1. Follow-up turns use apply_project_credit_for_thread_merge.';

-- Allow anchor rows to accumulate multiple credited turns (first turn still uses trigger: 0 -> 1).
alter table public.chat_results
  drop constraint if exists chat_results_credits_charged_valid;

alter table public.chat_results
  add constraint chat_results_credits_charged_valid
  check (credits_charged >= 0);

comment on column public.chat_results.credits_charged is
  'Credits attributed to this row: first billable transition sets 1 via trigger; each thread merge adds +1 via apply_project_credit_for_thread_merge.';

create table if not exists public.chat_merge_credit_charges (
  job_request_id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  charged_at timestamptz not null default now()
);

create index if not exists chat_merge_credit_charges_project_id_idx
  on public.chat_merge_credit_charges (project_id);

comment on table public.chat_merge_credit_charges is
  'Idempotency for merge-time project credits (one row per follow-up job request_id).';

alter table public.chat_merge_credit_charges enable row level security;

-- No policies: only SECURITY DEFINER RPC and service role maintenance.

create or replace function public.apply_project_credit_for_thread_merge(
  p_job_request_id uuid,
  p_anchor_request_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_user_id uuid;
  v_inserted int;
begin
  if p_job_request_id is null or p_anchor_request_id is null then
    raise exception 'job_request_id and anchor_request_id are required.';
  end if;

  if p_job_request_id = p_anchor_request_id then
    raise exception 'job_request_id must differ from anchor_request_id.';
  end if;

  select c.project_id, c.user_id
  into v_project_id, v_user_id
  from public.chat_results c
  where c.request_id = p_anchor_request_id;

  if v_project_id is null or v_user_id is null then
    raise exception 'Anchor chat_result not found or missing project_id/user_id.';
  end if;

  insert into public.chat_merge_credit_charges (job_request_id, project_id, user_id)
  values (p_job_request_id, v_project_id, v_user_id)
  on conflict (job_request_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    return;
  end if;

  update public.projects
  set
    used_credits = used_credits + 1,
    credit_balance = greatest(0, credit_balance - 1),
    updated_at = now()
  where id = v_project_id;

  update public.chat_results
  set credits_charged = credits_charged + 1
  where request_id = p_anchor_request_id;
end;
$$;

comment on function public.apply_project_credit_for_thread_merge(uuid, uuid) is
  'Idempotent: charge one project credit for a completed follow-up merge (increments anchor credits_charged).';

revoke all on function public.apply_project_credit_for_thread_merge(uuid, uuid) from public;
grant execute on function public.apply_project_credit_for_thread_merge(uuid, uuid) to service_role;
