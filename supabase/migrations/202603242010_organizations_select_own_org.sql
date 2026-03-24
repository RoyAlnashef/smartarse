-- Members need to read their organization row (name, credit_balance) for project list joins and UI.
-- Complements organizations_select_admin (admins see all rows).

drop policy if exists organizations_select_own_org on public.organizations;
create policy organizations_select_own_org
on public.organizations
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.status = 'active'
      and u.organization_id is not null
      and u.organization_id = organizations.id
  )
);
