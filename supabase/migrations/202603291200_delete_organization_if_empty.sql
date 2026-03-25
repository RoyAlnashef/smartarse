-- Hard-delete an organization only when it has no members and no projects.
-- SECURITY DEFINER bypasses RLS; caller must pass is_dashboard_admin().

create or replace function public.delete_organization_if_empty(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_dashboard_admin() then
    raise exception 'Only dashboard admins can delete organizations.';
  end if;

  if exists (select 1 from public.users u where u.organization_id = p_org_id) then
    raise exception 'Cannot delete organization while it has users.';
  end if;

  if exists (select 1 from public.projects p where p.organization_id = p_org_id) then
    raise exception 'Cannot delete organization while it has projects.';
  end if;

  delete from public.organizations where id = p_org_id;

  if not found then
    raise exception 'Organization not found.';
  end if;
end;
$$;

revoke all on function public.delete_organization_if_empty(uuid) from public;
grant execute on function public.delete_organization_if_empty(uuid) to authenticated;
