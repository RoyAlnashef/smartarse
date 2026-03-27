-- chat_results: one row per chat request / pipeline run (Disrupt contract + project scope).
-- Writes: Next.js service role (RLS bypass). n8n must not insert/update this table.
-- SELECT: same org as row, and either legacy unscoped row (project_id null) or project visible via auth_user_can_read_project (202603251200_fix_projects_rls_recursion.sql).

create table if not exists public.chat_results (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  user_id uuid references public.users (id) on delete set null,
  user_query text not null,
  status text not null default 'pending',
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  query_embedding text,
  cache_hit_count integer not null default 0,
  is_cacheable boolean not null default false,
  weighted boolean,
  data_source_mode text,
  system_version text,
  constraint chat_results_request_id_unique unique (request_id),
  constraint chat_results_cache_hit_non_negative check (cache_hit_count >= 0)
);

-- Disrupt / legacy DBs: table may already exist without project_id; CREATE above is a no-op then.
alter table public.chat_results
  add column if not exists project_id uuid references public.projects (id) on delete set null;

create index if not exists chat_results_user_project_created_idx
  on public.chat_results (user_id, project_id, created_at desc);

create index if not exists chat_results_organization_id_idx
  on public.chat_results (organization_id);

comment on table public.chat_results is 'Chat turn outcomes; persisted by app server with service role. project_id nullable for legacy/orphan pipelines.';
comment on column public.chat_results.request_id is 'Idempotent business key for upsert/poll; must be unique.';
comment on column public.chat_results.project_id is 'Optional project scope; null allows org-level legacy rows visible to org members.';

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
