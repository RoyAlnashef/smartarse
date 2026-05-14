-- Expand cite_color_token allowlist from single -500 shade
-- to full Tailwind palette steps for approved families.

alter table public.project_documents
  drop constraint if exists project_documents_cite_color_token_allowed;

alter table public.project_documents
  add constraint project_documents_cite_color_token_allowed
  check (
    cite_color_token is null
    or cite_color_token ~ '^(yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|amber)-(50|100|200|300|400|500|600|700|800|900|950)$'
  );
