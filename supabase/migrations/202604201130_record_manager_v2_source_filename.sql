-- Durable key for document-title mirror sync:
-- keep original upload filename immutable, separate from mutable display title.

alter table public.record_manager_v2
add column if not exists source_filename text;

-- Best-effort backfill for rows that still hold original filename in document_title.
update public.record_manager_v2
set source_filename = document_title
where source_filename is null
  and document_title is not null;

create index if not exists record_manager_v2_org_source_filename_idx
  on public.record_manager_v2 (organization_id, source_filename);
