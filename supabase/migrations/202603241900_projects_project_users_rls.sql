-- RLS for projects + project_users (Task 3).
-- Relies on public.is_dashboard_admin() from 202603232355_admin_rls_users_organizations.sql.

alter table public.projects enable row level security;
alter table public.project_users enable row level security;

-- ── projects ───────────────────────────────────────────

drop policy if exists projects_select_visible on public.projects;
create policy projects_select_visible
on public.projects
for select
to authenticated
using (
  public.is_dashboard_admin()
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'client'
      and u.status = 'active'
      and u.organization_id is not null
      and u.organization_id = projects.organization_id
  )
  or exists (
    select 1
    from public.users u
    inner join public.project_users pu on pu.user_id = u.id and pu.project_id = projects.id
    where u.id = auth.uid()
      and u.role = 'user'
      and u.status = 'active'
      and u.organization_id is not null
      and u.organization_id = projects.organization_id
  )
);

drop policy if exists projects_insert_admin on public.projects;
create policy projects_insert_admin
on public.projects
for insert
to authenticated
with check (public.is_dashboard_admin());

drop policy if exists projects_update_admin on public.projects;
create policy projects_update_admin
on public.projects
for update
to authenticated
using (public.is_dashboard_admin())
with check (public.is_dashboard_admin());

drop policy if exists projects_delete_admin on public.projects;
create policy projects_delete_admin
on public.projects
for delete
to authenticated
using (public.is_dashboard_admin());

-- ── project_users ───────────────────────────────────────

drop policy if exists project_users_select_visible on public.project_users;
create policy project_users_select_visible
on public.project_users
for select
to authenticated
using (
  public.is_dashboard_admin()
  or exists (
    select 1
    from public.users u
    inner join public.projects p on p.id = project_users.project_id
    where u.id = auth.uid()
      and u.role = 'client'
      and u.status = 'active'
      and u.organization_id is not null
      and u.organization_id = p.organization_id
  )
  or exists (
    select 1
    from public.users u
    inner join public.project_users pu_self
      on pu_self.user_id = u.id
     and pu_self.project_id = project_users.project_id
    inner join public.projects p on p.id = project_users.project_id
    where u.id = auth.uid()
      and u.role = 'user'
      and u.status = 'active'
      and u.organization_id is not null
      and u.organization_id = p.organization_id
  )
);

drop policy if exists project_users_insert_admin on public.project_users;
create policy project_users_insert_admin
on public.project_users
for insert
to authenticated
with check (public.is_dashboard_admin());

drop policy if exists project_users_update_admin on public.project_users;
create policy project_users_update_admin
on public.project_users
for update
to authenticated
using (public.is_dashboard_admin())
with check (public.is_dashboard_admin());

drop policy if exists project_users_delete_admin on public.project_users;
create policy project_users_delete_admin
on public.project_users
for delete
to authenticated
using (public.is_dashboard_admin());

-- Ensure API role can attempt operations (policies still gate rows).
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.project_users to authenticated;

-- Align with 202603240010_active_requires_organization.sql (table did not exist when that ran).
alter table public.projects
  drop constraint if exists projects_active_requires_organization;
alter table public.projects
  add constraint projects_active_requires_organization
  check (
    status::text not in ('active', 'live') or organization_id is not null
  );
