-- Reconcile projects.used_credits with attributed spend (sum of chat_results.credits_charged).
-- Keeps reporting aligned with per-user aggregates and the billing trigger going forward.

update public.projects p
set
  used_credits = coalesce(
    (
      select sum(c.credits_charged)
      from public.chat_results c
      where c.project_id = p.id
    )::integer,
    0
  ),
  updated_at = now();

comment on column public.projects.used_credits is
  'Lifetime credits attributed on this project (sum of chat_results.credits_charged); reconciled with billing trigger.';
