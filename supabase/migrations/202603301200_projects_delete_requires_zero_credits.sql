-- Only allow project deletion when no credits have been consumed on the project.

drop policy if exists projects_delete_admin on public.projects;
create policy projects_delete_admin
on public.projects
for delete
to authenticated
using (public.is_dashboard_admin() and used_credits = 0);
