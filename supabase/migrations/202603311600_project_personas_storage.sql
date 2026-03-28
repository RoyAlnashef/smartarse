-- Project persona metadata + private Storage bucket `project-personas`.
-- Upload/delete: dashboard admins. Read: anyone who can read the project (auth_user_can_read_project).
-- Path shape: {project_id}/{persona_id}/{filename} (mirrors project-documents).
-- Storage RLS reuses can_*_project_document_storage_object helpers (path segment checks only).

-- ── Table ─────────────────────────────────────────────────

create table if not exists public.project_personas (
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
  sort_order integer not null default 0,
  constraint project_personas_storage_path_unique unique (storage_path),
  constraint project_personas_size_non_negative check (size_bytes >= 0)
);

create index if not exists project_personas_project_id_idx
  on public.project_personas (project_id);

create index if not exists project_personas_project_id_sort_order_idx
  on public.project_personas (project_id, sort_order);

create index if not exists project_personas_uploaded_at_idx
  on public.project_personas (project_id, uploaded_at desc);

comment on table public.project_personas is
  'Persona markdown files per project; bytes live in storage bucket project-personas.';

comment on column public.project_personas.sort_order is
  'Display and context priority order within the project (0 = first / highest prominence).';

-- ── RLS (table) ───────────────────────────────────────────

alter table public.project_personas enable row level security;

drop policy if exists project_personas_select_visible on public.project_personas;
create policy project_personas_select_visible
on public.project_personas
for select
to authenticated
using (public.auth_user_can_read_project(project_id));

drop policy if exists project_personas_insert_admin on public.project_personas;
create policy project_personas_insert_admin
on public.project_personas
for insert
to authenticated
with check (public.is_dashboard_admin());

drop policy if exists project_personas_update_admin on public.project_personas;
create policy project_personas_update_admin
on public.project_personas
for update
to authenticated
using (public.is_dashboard_admin())
with check (public.is_dashboard_admin());

drop policy if exists project_personas_delete_admin on public.project_personas;
create policy project_personas_delete_admin
on public.project_personas
for delete
to authenticated
using (public.is_dashboard_admin());

grant select, insert, update, delete on public.project_personas to authenticated;

-- ── Storage bucket ───────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-personas',
  'project-personas',
  false,
  52428800,
  array[
    'text/markdown',
    'text/plain',
    'application/octet-stream'
  ]::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  public = excluded.public;

-- ── Extend project-documents MIME allowlist (markdown uploads) ─

update storage.buckets b
set allowed_mime_types =
  case
    when 'text/markdown' = any(coalesce(b.allowed_mime_types, array[]::text[]))
    then b.allowed_mime_types
    else coalesce(b.allowed_mime_types, array[]::text[]) || array['text/markdown']::text[]
  end
where b.id = 'project-documents';

-- ── Storage RLS (objects in project-personas) ─────────────
-- Reuses SECURITY DEFINER path helpers from 202603261600_storage_project_docs_rls_helpers.sql

drop policy if exists project_personas_storage_select on storage.objects;
create policy project_personas_storage_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-personas'
  and public.can_select_project_document_storage_object(name)
);

drop policy if exists project_personas_storage_insert on storage.objects;
create policy project_personas_storage_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-personas'
  and public.can_insert_project_document_storage_object(name)
);

drop policy if exists project_personas_storage_delete on storage.objects;
create policy project_personas_storage_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-personas'
  and public.is_dashboard_admin()
);

-- ── Reorder RPC ───────────────────────────────────────────

create or replace function public.reorder_project_personas(
  p_project_id uuid,
  p_persona_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  expected int;
  got int;
  distinct_ids int;
begin
  select count(*)::int into expected
  from public.project_personas
  where project_id = p_project_id;

  got := coalesce(array_length(p_persona_ids, 1), 0);

  if got <> expected then
    raise exception 'reorder_project_personas: expected % persona id(s), got %', expected, got;
  end if;

  if expected = 0 then
    return;
  end if;

  select count(distinct x)::int into distinct_ids
  from unnest(p_persona_ids) as x;

  if distinct_ids <> expected then
    raise exception 'reorder_project_personas: duplicate or invalid persona ids';
  end if;

  select count(*)::int into got
  from unnest(p_persona_ids) as x(id)
  inner join public.project_personas p
    on p.id = x.id and p.project_id = p_project_id;

  if got <> expected then
    raise exception 'reorder_project_personas: one or more ids do not belong to this project';
  end if;

  update public.project_personas p
  set sort_order = s.ord
  from (
    select
      id,
      (pos - 1)::int as ord
    from unnest(p_persona_ids) with ordinality as u(id, pos)
  ) s
  where p.id = s.id
    and p.project_id = p_project_id;
end;
$$;

grant execute on function public.reorder_project_personas(uuid, uuid[]) to authenticated;
