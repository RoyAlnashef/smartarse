-- Projects + assignment junction (schema only).
-- RLS policies: follow-up migration (see plan Task 3).

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'live',
  used_credits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity timestamptz,
  constraint projects_status_valid check (status in ('live', 'archived')),
  constraint projects_used_credits_non_negative check (used_credits >= 0)
);

create index if not exists projects_organization_id_idx on public.projects (organization_id);
create index if not exists projects_status_idx on public.projects (status);

create table if not exists public.project_users (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  primary key (project_id, user_id)
);

create index if not exists project_users_user_id_idx on public.project_users (user_id);

comment on table public.projects is 'Client engagements; scoped to organizations. Budget caps live on organizations, not here.';
comment on column public.projects.used_credits is 'Consumption only; no per-project total column.';
comment on table public.project_users is 'Users assigned to a project (visibility for role user; RLS in Task 3).';
