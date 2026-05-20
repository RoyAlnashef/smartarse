-- Single admin-designated demo project + per-request provisioned project for redirects.

alter table public.projects
  add column if not exists is_demo boolean not null default false;

comment on column public.projects.is_demo is
  'When true, this project is the sole demo entry point for approved demo access users.';

create unique index if not exists projects_only_one_demo
  on public.projects ((true))
  where is_demo is true;

alter table public.demo_access_requests
  add column if not exists provisioned_project_id uuid references public.projects (id) on delete set null;

comment on column public.demo_access_requests.provisioned_project_id is
  'Project assigned at approve time; used for post-login redirect.';
