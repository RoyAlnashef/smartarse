-- Tailwind palette token for UI source coloring (Data Sources, citations) and future n8n / context.
-- Allowlist excludes red, rose, orange (danger / alert). Keep aligned with lib/theme/cite-color-tokens.ts.

alter table public.project_documents
  add column if not exists cite_color_token text;

comment on column public.project_documents.cite_color_token is
  'Tailwind default palette token (e.g. sky-500) for source index color in UI; null = product default. Intended for n8n / LLM context in a later iteration.';

alter table public.project_documents
  drop constraint if exists project_documents_cite_color_token_allowed;

alter table public.project_documents
  add constraint project_documents_cite_color_token_allowed
  check (
    cite_color_token is null
    or cite_color_token in (
      'yellow-500',
      'lime-500',
      'green-500',
      'emerald-500',
      'teal-500',
      'cyan-500',
      'sky-500',
      'blue-500',
      'indigo-500',
      'violet-500',
      'purple-500',
      'fuchsia-500',
      'pink-500',
      'amber-500'
    )
  );
