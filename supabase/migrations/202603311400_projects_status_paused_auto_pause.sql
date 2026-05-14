-- Allow paused status; auto-pause live projects when allocated credits are exhausted.

alter table public.projects
  drop constraint if exists projects_status_valid;

alter table public.projects
  add constraint projects_status_valid
  check (status in ('live', 'paused', 'archived'));

-- Existing rows: no allocated pool implies not operable for chat under credit model.
update public.projects
set
  status = 'paused',
  updated_at = now()
where
  status = 'live'
  and credit_balance = 0;

create or replace function public.projects_auto_pause_on_depletion()
returns trigger
language plpgsql
as $$
begin
  if (
    old.used_credits is distinct from new.used_credits
    or old.credit_balance is distinct from new.credit_balance
  )
  and new.status = 'live'
  and new.credit_balance > 0
  and new.used_credits >= new.credit_balance
  then
    new.status := 'paused';
  end if;
  return new;
end;
$$;

drop trigger if exists projects_auto_pause_on_depletion on public.projects;

create trigger projects_auto_pause_on_depletion
before update on public.projects
for each row
execute procedure public.projects_auto_pause_on_depletion();

comment on function public.projects_auto_pause_on_depletion() is
  'When used_credits or credit_balance changes, set status to paused if live and pool is exhausted (used_credits >= credit_balance > 0).';
