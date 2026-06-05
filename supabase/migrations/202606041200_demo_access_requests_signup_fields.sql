-- Demo signup v2: name and organization on access requests.

alter table public.demo_access_requests
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists organization_name text;

comment on column public.demo_access_requests.first_name is
  'Prospect first name from /demo signup.';
comment on column public.demo_access_requests.last_name is
  'Prospect last name from /demo signup.';
comment on column public.demo_access_requests.organization_name is
  'Prospect organization from /demo signup.';
