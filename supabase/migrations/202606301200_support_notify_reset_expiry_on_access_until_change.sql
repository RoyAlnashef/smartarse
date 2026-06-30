-- When a project's access_until date is changed, clear any existing
-- access-expiry notification log rows so the cron can re-send against
-- the new date.

create or replace function public.support_notify_reset_expiry_on_access_until_change()
returns trigger language plpgsql security definer as $$
begin
  delete from public.support_notification_log
  where project_id = new.id
    and event_key in ('access_28d', 'access_14d');
  return new;
end;
$$;

comment on function public.support_notify_reset_expiry_on_access_until_change() is
  'After access_until changes: clears access-expiry log rows so the cron re-evaluates and re-sends for the new date.';

drop trigger if exists projects_support_notify_reset_expiry on public.projects;

create trigger projects_support_notify_reset_expiry
after update of access_until on public.projects
for each row
when (old.access_until is distinct from new.access_until)
execute procedure public.support_notify_reset_expiry_on_access_until_change();
