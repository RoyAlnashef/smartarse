-- Upload / dashboard mutations use is_dashboard_admin(). A strict `role = 'admin'` match
-- fails when the row has different casing or whitespace (common from manual SQL or imports).

create or replace function public.is_dashboard_admin()
returns boolean
language sql
security definer
set search_path = public
stable
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
