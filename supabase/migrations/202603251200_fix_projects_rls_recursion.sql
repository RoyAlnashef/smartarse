-- Fix "infinite recursion detected in policy for relation projects".
-- projects_select referenced project_users; project_users_select referenced projects.
-- Use SECURITY DEFINER helper so membership checks do not re-enter RLS on the same tables.

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
        and u.role = 'client'
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
        and u.role = 'user'
        and u.status = 'active'
        and u.organization_id is not null
        and p.organization_id = u.organization_id
    );
$$;

revoke all on function public.auth_user_can_read_project(uuid) from public;
grant execute on function public.auth_user_can_read_project(uuid) to authenticated;

drop policy if exists projects_select_visible on public.projects;
create policy projects_select_visible
on public.projects
for select
to authenticated
using (public.auth_user_can_read_project(id));

drop policy if exists project_users_select_visible on public.project_users;
create policy project_users_select_visible
on public.project_users
for select
to authenticated
using (public.auth_user_can_read_project(project_id));
