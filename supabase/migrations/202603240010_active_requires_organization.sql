-- Enforce that "active" entities must be attached to an organization.
-- Users: enforce now (with backfill + validated constraints).
-- Projects: add deferred constraint for future project schema rollout.

do $$
begin
  if to_regclass('public.users') is not null then
    -- Ensure a status column exists so we can enforce active/inactive semantics.
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'users'
        and column_name = 'status'
    ) then
      alter table public.users
        add column status text;
    end if;

    -- Normalize existing rows before making constraints strict.
    update public.users
    set status = 'inactive'
    where organization_id is null
      and coalesce(status::text, 'active') = 'active';

    update public.users
    set status = 'active'
    where organization_id is not null
      and status is null;

    update public.users
    set status = 'inactive'
    where status is null;

    alter table public.users
      alter column status set default 'inactive',
      alter column status set not null;

    alter table public.users
      drop constraint if exists users_status_valid;
    alter table public.users
      add constraint users_status_valid
      check (status::text in ('active', 'inactive'));

    alter table public.users
      drop constraint if exists users_active_requires_organization;
    alter table public.users
      add constraint users_active_requires_organization
      check (status::text <> 'active' or organization_id is not null);
  end if;

  if to_regclass('public.projects') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'projects'
         and column_name = 'organization_id'
     )
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'projects'
         and column_name = 'status'
     ) then
    -- Deferred guard: enforce for new/updated rows, postpone legacy cleanup.
    alter table public.projects
      drop constraint if exists projects_active_requires_organization;
    alter table public.projects
      add constraint projects_active_requires_organization
      check (
        status::text not in ('active', 'live') or organization_id is not null
      ) not valid;
  end if;
end $$;
