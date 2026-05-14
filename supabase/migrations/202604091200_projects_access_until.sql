-- Optional end date for project access (inclusive calendar day in DB timezone, typically UTC).

alter table public.projects
  add column if not exists access_until date;

comment on column public.projects.access_until is
  'If set, access is valid through this calendar day (inclusive). When current_date > access_until, live projects are paused.';

-- Coerce live → paused when the access window has ended (runs on any row touch).
create or replace function public.projects_auto_pause_on_access_expiry()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'live'
     and new.access_until is not null
     and current_date > new.access_until
  then
    new.status := 'paused';
  end if;
  return new;
end;
$$;

drop trigger if exists projects_auto_pause_on_access_expiry on public.projects;

create trigger projects_auto_pause_on_access_expiry
before insert or update on public.projects
for each row
execute procedure public.projects_auto_pause_on_access_expiry();

comment on function public.projects_auto_pause_on_access_expiry() is
  'Before insert/update, set status to paused if live and access_until is in the past.';

-- Called from app server (service role) before chat authorization so expiry applies without waiting for another row update.
create or replace function public.pause_project_if_access_expired(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.projects
  set
    status = 'paused',
    updated_at = now()
  where id = p_project_id
    and status = 'live'
    and access_until is not null
    and current_date > access_until;
end;
$$;

revoke all on function public.pause_project_if_access_expired(uuid) from public;
grant execute on function public.pause_project_if_access_expired(uuid) to service_role;

comment on function public.pause_project_if_access_expired(uuid) is
  'Sets project to paused when live and access_until has passed; for service_role callers only.';

create or replace function public.pause_all_projects_expired_access()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.projects
  set
    status = 'paused',
    updated_at = now()
  where status = 'live'
    and access_until is not null
    and current_date > access_until;
end;
$$;

revoke all on function public.pause_all_projects_expired_access() from public;
grant execute on function public.pause_all_projects_expired_access() to service_role;

comment on function public.pause_all_projects_expired_access() is
  'Batch pause for all live projects past access_until; for scheduled service_role jobs.';
