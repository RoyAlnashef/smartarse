-- Aggregated attributed spend for project cards and list views (matches sum(chat_results.credits_charged)).

create or replace function public.project_attributed_credits_by_projects(p_project_ids uuid[])
returns table (project_id uuid, credits_spent bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.project_id,
    sum(c.credits_charged)::bigint as credits_spent
  from public.chat_results c
  where
    c.project_id is not null
    and c.project_id = any(p_project_ids)
    and public.auth_user_can_read_project(c.project_id)
  group by c.project_id;
$$;

comment on function public.project_attributed_credits_by_projects(uuid[]) is
  'Per-project sum of credits_charged for projects the caller can read; for UI meters aligned with billing.';

revoke all on function public.project_attributed_credits_by_projects(uuid[]) from public;
grant execute on function public.project_attributed_credits_by_projects(uuid[]) to authenticated;
