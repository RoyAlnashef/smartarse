-- Admin-focused RLS for organizations/users dashboard mutations.
-- This migration is idempotent and can be re-run safely.

-- 1) Helper used by RLS policies to determine admin access.
create or replace function public.is_dashboard_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and lower(trim(coalesce(u.role::text, ''))) = 'admin'
  );
$$;

revoke all on function public.is_dashboard_admin() from public;
grant execute on function public.is_dashboard_admin() to authenticated;

-- 2) Ensure RLS is enabled.
alter table public.organizations enable row level security;
alter table public.users enable row level security;

-- 3) organizations policies (admin only for dashboard management).
drop policy if exists organizations_select_admin on public.organizations;
create policy organizations_select_admin
on public.organizations
for select
to authenticated
using (public.is_dashboard_admin());

drop policy if exists organizations_insert_admin on public.organizations;
create policy organizations_insert_admin
on public.organizations
for insert
to authenticated
with check (public.is_dashboard_admin());

drop policy if exists organizations_update_admin on public.organizations;
create policy organizations_update_admin
on public.organizations
for update
to authenticated
using (public.is_dashboard_admin())
with check (public.is_dashboard_admin());

-- 4) users policies.
-- Allow users to read their own row (auth bootstrap), admins can read all.
drop policy if exists users_select_self_or_admin on public.users;
create policy users_select_self_or_admin
on public.users
for select
to authenticated
using (auth.uid() = id or public.is_dashboard_admin());

-- Admin-only updates used by dashboard edit flows.
drop policy if exists users_update_admin on public.users;
create policy users_update_admin
on public.users
for update
to authenticated
using (public.is_dashboard_admin())
with check (public.is_dashboard_admin());

-- Admin-only inserts (used if you insert user profile rows directly).
drop policy if exists users_insert_admin on public.users;
create policy users_insert_admin
on public.users
for insert
to authenticated
with check (public.is_dashboard_admin());
