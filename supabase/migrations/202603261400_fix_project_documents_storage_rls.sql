-- Fix 22P02 on Storage upload: avoid `split_part(...)::uuid` in RLS (invalid cast → invalid_text_representation).
-- Compare project id as text to the first path segment instead.

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
