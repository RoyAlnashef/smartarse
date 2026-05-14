-- Bind optional persona file to one of four canonical study segments; display overrides for client UI.

alter table public.project_personas
  add column if not exists canonical_segment_id text;

alter table public.project_personas
  add column if not exists display_name text;

alter table public.project_personas
  add column if not exists segment_description text;

alter table public.project_personas
  add column if not exists segment_color_token text;

comment on column public.project_personas.canonical_segment_id is
  'When set, this persona file represents a fixed study segment (seg-* slug); at most one row per project per segment.';

comment on column public.project_personas.display_name is
  'Optional segment card label; null or empty means use mock segment title for that canonical id.';

comment on column public.project_personas.segment_description is
  'Optional segment list description; null or empty means use mock shortDescription for that canonical id.';

comment on column public.project_personas.segment_color_token is
  'Tailwind palette token for segment dot/shell; null = mock default for canonical id. Same allowlist as project_documents.cite_color_token.';

alter table public.project_personas
  drop constraint if exists project_personas_canonical_segment_id_allowed;

alter table public.project_personas
  add constraint project_personas_canonical_segment_id_allowed
  check (
    canonical_segment_id is null
    or canonical_segment_id in (
      'seg-do-nothing',
      'seg-minimalists',
      'seg-muddled-middle',
      'seg-do-their-bit'
    )
  );

alter table public.project_personas
  drop constraint if exists project_personas_display_name_len;

alter table public.project_personas
  add constraint project_personas_display_name_len
  check (display_name is null or char_length(display_name) <= 500);

alter table public.project_personas
  drop constraint if exists project_personas_segment_description_len;

alter table public.project_personas
  add constraint project_personas_segment_description_len
  check (segment_description is null or char_length(segment_description) <= 2000);

alter table public.project_personas
  drop constraint if exists project_personas_segment_color_token_allowed;

alter table public.project_personas
  add constraint project_personas_segment_color_token_allowed
  check (
    segment_color_token is null
    or segment_color_token ~ '^(yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|amber)-(50|100|200|300|400|500|600|700|800|900|950)$'
  );

create unique index if not exists project_personas_project_canonical_segment_unique
  on public.project_personas (project_id, canonical_segment_id)
  where canonical_segment_id is not null;
