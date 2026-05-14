-- Admin-selected file-type icon for Data Sources, citations merge, and n8n / webhook context.
-- Allowlist kept in sync with lib/theme/source-file-icons.ts SOURCE_FILE_ICON_KEYS.

alter table public.project_documents
  add column if not exists source_icon_key text;

comment on column public.project_documents.source_icon_key is
  'Lucide-backed icon key for UI (pdf, spreadsheet, document, presentation, markdown); null = infer from file extension.';

alter table public.project_documents
  drop constraint if exists project_documents_source_icon_key_allowed;

alter table public.project_documents
  add constraint project_documents_source_icon_key_allowed
  check (
    source_icon_key is null
    or source_icon_key in (
      'pdf',
      'spreadsheet',
      'document',
      'presentation',
      'markdown'
    )
  );
