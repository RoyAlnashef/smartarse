-- Auto-pause should depend on remaining credits (credit_balance), not lifetime spent (used_credits).
-- The prior trigger paused when used_credits >= credit_balance while balance > 0, which mispauses
-- when "spent" is informational/historical and does not track down the same counter as top-ups.

create or replace function public.projects_auto_pause_on_depletion()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'live'
     and new.credit_balance = 0
  then
    new.status := 'paused';
  end if;
  return new;
end;
$$;

drop trigger if exists projects_auto_pause_on_depletion on public.projects;

create trigger projects_auto_pause_on_depletion
before insert or update on public.projects
for each row
execute procedure public.projects_auto_pause_on_depletion();

comment on function public.projects_auto_pause_on_depletion() is
  'Before insert/update, set status to paused if the row would be live with zero credit_balance; used_credits is ignored.';

comment on column public.projects.credit_balance is
  'Credits currently available for this project (admin top-ups increase this). When zero, live projects auto-pause.';

comment on column public.projects.used_credits is
  'Lifetime credits spent on this project (informational / reporting); does not drive pause status.';
