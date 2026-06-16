-- Store marketing email consent on user profiles (copied from demo signup on provision).

do $$
begin
  if to_regclass('public.users') is not null then
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'users'
        and column_name = 'marketing_opt_in'
    ) then
      alter table public.users
        add column marketing_opt_in boolean not null default false;
    end if;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'users'
        and column_name = 'marketing_consent_at'
    ) then
      alter table public.users
        add column marketing_consent_at timestamptz;
    end if;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'users'
        and column_name = 'marketing_consent_version'
    ) then
      alter table public.users
        add column marketing_consent_version text;
    end if;
  end if;
end $$;

-- Backfill from linked demo access requests that recorded marketing consent.
update public.users u
set
  marketing_opt_in = true,
  marketing_consent_at = (r.metadata->'consents'->'marketing'->>'acceptedAt')::timestamptz,
  marketing_consent_version = r.metadata->'consents'->'marketing'->>'version'
from public.demo_access_requests r
where r.user_id = u.id
  and r.metadata->'consents'->'marketing' is not null;
