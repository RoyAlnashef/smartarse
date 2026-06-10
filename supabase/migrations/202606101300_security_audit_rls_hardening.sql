-- Security audit remediations: tighten chat_results visibility and normalize project role checks.

-- SEC-010: Legacy chat_results rows with null project_id are visible only to the
-- owning user (or dashboard admins), not all org members.
drop policy if exists chat_results_select_visible on public.chat_results;
create policy chat_results_select_visible
on public.chat_results
for select
to authenticated
using (
  public.is_dashboard_admin()
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.status = 'active'
      and u.organization_id is not null
      and u.organization_id = chat_results.organization_id
      and (
        (
          chat_results.project_id is null
          and chat_results.user_id = auth.uid()
        )
        or (
          chat_results.project_id is not null
          and public.auth_user_can_read_project(chat_results.project_id)
        )
      )
  )
);

-- SEC-011: Case-insensitive role matching in project access helper.
create or replace function public.auth_user_can_read_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_dashboard_admin()
    or exists (
      select 1
      from public.users u
      inner join public.projects p on p.id = p_project_id
      where u.id = auth.uid()
        and lower(trim(coalesce(u.role::text, ''))) = 'client'
        and u.status = 'active'
        and u.organization_id is not null
        and p.organization_id = u.organization_id
    )
    or exists (
      select 1
      from public.users u
      inner join public.projects p on p.id = p_project_id
      inner join public.project_users pu
        on pu.project_id = p.id
       and pu.user_id = u.id
      where u.id = auth.uid()
        and lower(trim(coalesce(u.role::text, ''))) = 'user'
        and u.status = 'active'
        and u.organization_id is not null
        and p.organization_id = u.organization_id
    );
$$;

revoke all on function public.auth_user_can_read_project(uuid) from public;
grant execute on function public.auth_user_can_read_project(uuid) to authenticated;
