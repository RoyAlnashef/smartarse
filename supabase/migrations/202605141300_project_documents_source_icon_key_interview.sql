-- Extend the source_icon_key allowlist to include the `interview` (chat / quote) icon
-- so admins can mark a document (e.g. qualitative interview transcripts) with the
-- MessageSquareQuote pictograph used by the [4] interview citation Popover + Dialog.
-- Allowlist must stay in sync with lib/theme/source-file-icons.ts SOURCE_FILE_ICON_KEYS.

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
      'markdown',
      'interview'
    )
  );

comment on column public.project_documents.source_icon_key is
  'Lucide-backed icon key for UI (pdf, spreadsheet, document, presentation, markdown, interview); null = infer from file extension.';
