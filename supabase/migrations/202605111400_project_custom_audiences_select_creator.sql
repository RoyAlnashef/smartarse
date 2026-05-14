-- Saved custom audiences: only the creator (or dashboard admin) can read a row.
-- Previously any project member could SELECT all rows on the project.

drop policy if exists project_custom_audiences_select_visible on public.project_custom_audiences;

create policy project_custom_audiences_select_visible
on public.project_custom_audiences
for select
to authenticated
using (
  public.auth_user_can_read_project(project_id)
  and (
    created_by = auth.uid()
    or public.is_dashboard_admin()
  )
);
