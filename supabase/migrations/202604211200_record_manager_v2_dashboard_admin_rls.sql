-- Mirror sync from dashboard runs as authenticated Supabase user with
-- public.is_dashboard_admin() = true. Tenant-scoped policies on
-- record_manager_v2 often filter by organization_id = users.organization_id;
-- offline-ingested rows may use a different organization_id, so SELECT
-- returns zero rows and the app reports "no matching record".
--
-- RLS combines multiple PERMISSIVE policies with OR: adding these allows
-- dashboard admins to read/update any row for this MVP workaround, while
-- existing tenant policies can remain for other roles / non-admin users.

alter table public.record_manager_v2 enable row level security;

drop policy if exists record_manager_v2_select_dashboard_admin on public.record_manager_v2;
create policy record_manager_v2_select_dashboard_admin
on public.record_manager_v2
for select
to authenticated
using (public.is_dashboard_admin());

drop policy if exists record_manager_v2_update_dashboard_admin on public.record_manager_v2;
create policy record_manager_v2_update_dashboard_admin
on public.record_manager_v2
for update
to authenticated
using (public.is_dashboard_admin())
with check (public.is_dashboard_admin());

grant select, update on public.record_manager_v2 to authenticated;
