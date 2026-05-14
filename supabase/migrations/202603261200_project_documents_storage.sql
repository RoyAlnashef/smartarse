-- Project document metadata + private Storage bucket `project-documents`.
-- Upload/delete: dashboard admins. Read: anyone who can read the project (auth_user_can_read_project).

-- ── Table ─────────────────────────────────────────────────

create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  storage_path text not null,
  size_bytes bigint not null,
  mime_type text,
  uploaded_by uuid references public.users (id) on delete set null,
  uploaded_at timestamptz not null default now(),
  status text not null default 'ready'
    check (status in ('processing', 'ready', 'error')),
  constraint project_documents_storage_path_unique unique (storage_path),
  constraint project_documents_size_non_negative check (size_bytes >= 0)
);

create index if not exists project_documents_project_id_idx
  on public.project_documents (project_id);

create index if not exists project_documents_uploaded_at_idx
  on public.project_documents (project_id, uploaded_at desc);

comment on table public.project_documents is 'Research files per project; bytes live in storage bucket project-documents.';

-- ── RLS (table) ───────────────────────────────────────────

alter table public.project_documents enable row level security;

drop policy if exists project_documents_select_visible on public.project_documents;
create policy project_documents_select_visible
on public.project_documents
for select
to authenticated
using (public.auth_user_can_read_project(project_id));

drop policy if exists project_documents_insert_admin on public.project_documents;
create policy project_documents_insert_admin
on public.project_documents
for insert
to authenticated
with check (public.is_dashboard_admin());

drop policy if exists project_documents_update_admin on public.project_documents;
create policy project_documents_update_admin
on public.project_documents
for update
to authenticated
using (public.is_dashboard_admin())
with check (public.is_dashboard_admin());

drop policy if exists project_documents_delete_admin on public.project_documents;
create policy project_documents_delete_admin
on public.project_documents
for delete
to authenticated
using (public.is_dashboard_admin());

grant select, insert, update, delete on public.project_documents to authenticated;

-- ── Storage bucket ───────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-documents',
  'project-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'text/csv',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream'
  ]::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  public = excluded.public;

-- ── Storage RLS (objects in project-documents) ────────────
-- Path shape: {project_id}/{document_id}/{filename}

-- Path shape: {project_id}/{document_id}/{filename}
-- Compare project id as text to path segment (no ::uuid on user path → avoids 22P02).
drop policy if exists project_documents_storage_select on storage.objects;
create policy project_documents_storage_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-documents'
  and exists (
    select 1
    from public.projects p
    where lower(p.id::text) = lower(split_part(name, '/', 1))
      and public.auth_user_can_read_project(p.id)
  )
);

drop policy if exists project_documents_storage_insert on storage.objects;
create policy project_documents_storage_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-documents'
  and public.is_dashboard_admin()
  and exists (
    select 1
    from public.projects p
    where lower(p.id::text) = lower(split_part(name, '/', 1))
  )
);

drop policy if exists project_documents_storage_delete on storage.objects;
create policy project_documents_storage_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-documents'
  and public.is_dashboard_admin()
);
