-- Storage upload failed with RLS even for dashboard admins: the policy used
-- `exists (select 1 from projects ...)` under the invoker, so `projects` RLS
-- could prevent seeing the row (or interact oddly) while evaluating Storage RLS.
-- These SECURITY DEFINER helpers read `projects` as the function owner (bypasses
-- RLS on that scan) and still use auth.uid() / is_dashboard_admin() for permission.

create or replace function public.storage_project_documents_path_first_segment(object_name text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(
      split_part(ltrim(coalesce(object_name, ''), '/'), '/', 1)
    ),
    ''
  );
$$;

revoke all on function public.storage_project_documents_path_first_segment(text) from public;
-- Only called from other definer helpers in this migration (same owner → no extra grant).

-- Admin upload: must be dashboard admin and path must start with a real project id.
create or replace function public.can_insert_project_document_storage_object(object_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_dashboard_admin()
    and exists (
      select 1
      from public.projects p
      where lower(p.id::text)
        = lower(public.storage_project_documents_path_first_segment(object_name))
    );
$$;

revoke all on function public.can_insert_project_document_storage_object(text) from public;
grant execute on function public.can_insert_project_document_storage_object(text) to authenticated;

-- Read: project exists at path prefix and caller may read that project (uses session uid).
create or replace function public.can_select_project_document_storage_object(object_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select public.auth_user_can_read_project(p.id)
      from public.projects p
      where lower(p.id::text)
        = lower(public.storage_project_documents_path_first_segment(object_name))
      limit 1
    ),
    false
  );
$$;

revoke all on function public.can_select_project_document_storage_object(text) from public;
grant execute on function public.can_select_project_document_storage_object(text) to authenticated;

drop policy if exists project_documents_storage_select on storage.objects;
create policy project_documents_storage_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-documents'
  and public.can_select_project_document_storage_object(name)
);

drop policy if exists project_documents_storage_insert on storage.objects;
create policy project_documents_storage_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-documents'
  and public.can_insert_project_document_storage_object(name)
);
