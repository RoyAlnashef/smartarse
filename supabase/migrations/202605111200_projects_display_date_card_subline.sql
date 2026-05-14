-- Client project card: optional header date and third-line copy (admin-controlled).

alter table public.projects
  add column if not exists display_date date;

alter table public.projects
  add column if not exists card_subline text;

comment on column public.projects.display_date is
  'Optional calendar date shown on the client project listing card header; null uses created_at.';

comment on column public.projects.card_subline is
  'Optional override for the third line on the client project card; null/empty uses auto source summary.';
