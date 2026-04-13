-- Optional human-facing label for project documents (UI + n8n metadata).
-- Storage path and `name` (original filename) stay canonical.

alter table public.project_documents
  add column if not exists display_name text;

comment on column public.project_documents.display_name is
  'Optional label for Sources and citations; null or empty means use `name`.';

alter table public.project_documents
  drop constraint if exists project_documents_display_name_len;

alter table public.project_documents
  add constraint project_documents_display_name_len
  check (display_name is null or char_length(display_name) <= 500);
