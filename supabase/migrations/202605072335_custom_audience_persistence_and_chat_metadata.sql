-- Saved custom audiences for project-scoped audience composition.
-- Includes denormalized chat_results metadata for restoring/rendering custom-audience context.

create table if not exists public.project_custom_audiences (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid references public.users (id) on delete set null,
  name text not null,
  description text,
  filters_summary text,
  filters jsonb not null default '{}'::jsonb,
  child_segments jsonb not null default '[]'::jsonb,
  child_segment_color_tokens text[] not null default '{}'::text[],
  base_size integer check (base_size is null or base_size >= 0),
  avg_concern numeric(6, 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_custom_audiences_project_id_created_at_idx
  on public.project_custom_audiences (project_id, created_at desc);

create index if not exists project_custom_audiences_org_id_project_id_idx
  on public.project_custom_audiences (organization_id, project_id);

comment on table public.project_custom_audiences is
  'Saved custom audience detail-state snapshots by project and organization.';

comment on column public.project_custom_audiences.child_segments is
  'JSON array of child segment objects ({ id, name, color_token }) used for detail restore and stacked dots.';

comment on column public.project_custom_audiences.child_segment_color_tokens is
  'Flattened color token stack used by chat/history denormalization and quick rendering.';

create or replace function public.set_project_custom_audiences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_project_custom_audiences_updated_at on public.project_custom_audiences;
create trigger trg_project_custom_audiences_updated_at
before update on public.project_custom_audiences
for each row
execute function public.set_project_custom_audiences_updated_at();

alter table public.project_custom_audiences enable row level security;

drop policy if exists project_custom_audiences_select_visible on public.project_custom_audiences;
create policy project_custom_audiences_select_visible
on public.project_custom_audiences
for select
to authenticated
using (public.auth_user_can_read_project(project_id));

drop policy if exists project_custom_audiences_insert_visible on public.project_custom_audiences;
create policy project_custom_audiences_insert_visible
on public.project_custom_audiences
for insert
to authenticated
with check (
  public.auth_user_can_read_project(project_id)
  and organization_id = (select p.organization_id from public.projects p where p.id = project_id)
  and created_by = auth.uid()
);

drop policy if exists project_custom_audiences_update_owner_or_admin on public.project_custom_audiences;
create policy project_custom_audiences_update_owner_or_admin
on public.project_custom_audiences
for update
to authenticated
using (
  public.auth_user_can_read_project(project_id)
  and (created_by = auth.uid() or public.is_dashboard_admin())
)
with check (
  public.auth_user_can_read_project(project_id)
  and organization_id = (select p.organization_id from public.projects p where p.id = project_id)
  and (created_by = auth.uid() or public.is_dashboard_admin())
);

drop policy if exists project_custom_audiences_delete_owner_or_admin on public.project_custom_audiences;
create policy project_custom_audiences_delete_owner_or_admin
on public.project_custom_audiences
for delete
to authenticated
using (
  public.auth_user_can_read_project(project_id)
  and (created_by = auth.uid() or public.is_dashboard_admin())
);

grant select, insert, update, delete on public.project_custom_audiences to authenticated;

alter table public.chat_results
  add column if not exists custom_audience_id uuid references public.project_custom_audiences (id) on delete set null,
  add column if not exists custom_audience_name text,
  add column if not exists custom_audience_child_segment_ids text[],
  add column if not exists custom_audience_child_segment_names text[],
  add column if not exists custom_audience_child_segment_color_tokens text[];

comment on column public.chat_results.custom_audience_id is
  'Applied custom audience identifier for this thread anchor row.';

comment on column public.chat_results.custom_audience_name is
  'Applied custom audience display name captured at message time.';

comment on column public.chat_results.custom_audience_child_segment_ids is
  'Denormalized child segment ids used to restore custom audience state.';

comment on column public.chat_results.custom_audience_child_segment_names is
  'Denormalized child segment names shown in chat/history context chips.';

comment on column public.chat_results.custom_audience_child_segment_color_tokens is
  'Denormalized stacked color tokens used for multi-segment custom audience indicators.';
