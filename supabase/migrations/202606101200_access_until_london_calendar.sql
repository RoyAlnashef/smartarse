-- Evaluate access_until against London calendar days (Europe/London).

comment on column public.projects.access_until is
  'If set, access is valid through this calendar day (inclusive). When the London calendar date passes access_until, live projects are paused.';

create or replace function public.projects_auto_pause_on_access_expiry()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'live'
     and new.access_until is not null
     and (timezone('Europe/London', now()))::date > new.access_until
  then
    new.status := 'paused';
  end if;
  return new;
end;
$$;

comment on function public.projects_auto_pause_on_access_expiry() is
  'Before insert/update, set status to paused if live and access_until is in the past (London calendar day).';

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
    and (timezone('Europe/London', now()))::date > access_until;
end;
$$;

comment on function public.pause_project_if_access_expired(uuid) is
  'Sets project to paused when live and access_until has passed (London calendar day); for service_role callers only.';

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
    and (timezone('Europe/London', now()))::date > access_until;
end;
$$;

comment on function public.pause_all_projects_expired_access() is
  'Batch pause for all live projects past access_until (London calendar day); for scheduled service_role jobs.';
