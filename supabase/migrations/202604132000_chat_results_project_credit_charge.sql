-- Bill 1 project credit per chat_results row when it first reaches a terminal status
-- (complete / error_fallback) with project + user scope. Idempotent via credits_charged.
-- Project pause remains driven by credit_balance hitting zero (see
-- 202604091800_projects_auto_pause_balance_only.sql), not by used_credits.

alter table public.chat_results
  add column if not exists credits_charged integer not null default 0;

alter table public.chat_results
  drop constraint if exists chat_results_credits_charged_valid;

alter table public.chat_results
  add constraint chat_results_credits_charged_valid
  check (credits_charged in (0, 1));

comment on column public.chat_results.credits_charged is
  '1 after this row triggered a project credit charge (used_credits +1, credit_balance -1); 0 otherwise.';

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

drop trigger if exists chat_results_apply_project_credit_trigger on public.chat_results;

create trigger chat_results_apply_project_credit_trigger
before insert or update of status, project_id, user_id on public.chat_results
for each row
execute procedure public.chat_results_apply_project_credit();

comment on function public.chat_results_apply_project_credit() is
  'Before insert/update: when a row first becomes billable, increment projects.used_credits, decrement credit_balance (floored at 0), set credits_charged=1.';

-- Dashboard admin read helpers (RLS-safe aggregation without wide chat_results selects).

create or replace function public.dashboard_project_credit_spend_by_user(p_project_id uuid)
returns table (user_id uuid, credits_spent bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_dashboard_admin() then
    raise exception 'Only dashboard admins can read credit spend aggregates.';
  end if;

  return query
  select
    c.user_id,
    sum(c.credits_charged)::bigint as credits_spent
  from public.chat_results c
  where c.project_id = p_project_id
    and c.user_id is not null
  group by c.user_id;
end;
$$;

create or replace function public.dashboard_users_credit_spend()
returns table (user_id uuid, credits_spent bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_dashboard_admin() then
    raise exception 'Only dashboard admins can read credit spend aggregates.';
  end if;

  return query
  select
    c.user_id,
    sum(c.credits_charged)::bigint as credits_spent
  from public.chat_results c
  where c.user_id is not null
  group by c.user_id;
end;
$$;

revoke all on function public.dashboard_project_credit_spend_by_user(uuid) from public;
grant execute on function public.dashboard_project_credit_spend_by_user(uuid) to authenticated;

revoke all on function public.dashboard_users_credit_spend() from public;
grant execute on function public.dashboard_users_credit_spend() to authenticated;
