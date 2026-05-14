-- If chat_results predates smart-arse (e.g. Disrupt), 202603311200's CREATE TABLE IF NOT EXISTS
-- skipped defining the table and the migration could fail at index time (project_id missing).
-- This migration is idempotent: safe after a full 202603311200 apply as well.

alter table public.chat_results
  add column if not exists project_id uuid references public.projects (id) on delete set null;

create index if not exists chat_results_user_project_created_idx
  on public.chat_results (user_id, project_id, created_at desc);

create index if not exists chat_results_organization_id_idx
  on public.chat_results (organization_id);

alter table public.chat_results enable row level security;

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
        chat_results.project_id is null
        or public.auth_user_can_read_project(chat_results.project_id)
      )
  )
);

grant select on public.chat_results to authenticated;
