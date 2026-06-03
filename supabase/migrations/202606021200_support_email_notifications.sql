-- Disrupt support inbox notifications: platform settings, per-project credit threshold,
-- dedupe log, and credit-balance crossing trigger.

-- ── platform_settings (singleton) ───────────────────────────────────────────

create table if not exists public.platform_settings (
  id text primary key default 'default'
    check (id = 'default'),
  support_email text not null,
  notify_credit_balance_low boolean not null default true,
  notify_access_expires_4_weeks boolean not null default true,
  notify_access_expires_2_weeks boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table public.platform_settings is
  'Singleton platform-wide settings for Disrupt support notification emails.';

insert into public.platform_settings (id, support_email)
values ('default', 'smart-arse@disrupt-insight.com')
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

drop policy if exists platform_settings_select_admin on public.platform_settings;
create policy platform_settings_select_admin
  on public.platform_settings
  for select
  to authenticated
  using (public.is_dashboard_admin());

drop policy if exists platform_settings_update_admin on public.platform_settings;
create policy platform_settings_update_admin
  on public.platform_settings
  for update
  to authenticated
  using (public.is_dashboard_admin())
  with check (public.is_dashboard_admin());

grant select, update on public.platform_settings to authenticated;

-- ── per-project credit alert threshold ────────────────────────────────────────

alter table public.projects
  add column if not exists credit_alert_threshold integer;

alter table public.projects
  drop constraint if exists projects_credit_alert_threshold_positive;

alter table public.projects
  add constraint projects_credit_alert_threshold_positive
  check (credit_alert_threshold is null or credit_alert_threshold > 0);

comment on column public.projects.credit_alert_threshold is
  'When set, email Disrupt support once when credit_balance drops below this value; null disables alerts.';

-- ── notification dedupe / outbox log ──────────────────────────────────────────

create table if not exists public.support_notification_log (
  id uuid primary key default gen_random_uuid(),
  notification_type text not null
    check (
      notification_type in (
        'credit_balance_low',
        'access_expires_4_weeks',
        'access_expires_2_weeks'
      )
    ),
  project_id uuid not null references public.projects (id) on delete cascade,
  event_key text not null
    check (event_key in ('credit_low', 'access_28d', 'access_14d')),
  status text not null default 'pending'
    check (status in ('pending', 'sent')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint support_notification_log_unique_event
    unique (notification_type, project_id, event_key)
);

comment on table public.support_notification_log is
  'Idempotency log for Disrupt support emails; credit_low rows queue via status=pending for outbox cron.';

create index if not exists support_notification_log_pending_idx
  on public.support_notification_log (created_at)
  where status = 'pending';

create index if not exists support_notification_log_project_idx
  on public.support_notification_log (project_id);

alter table public.support_notification_log enable row level security;

drop policy if exists support_notification_log_select_admin on public.support_notification_log;
create policy support_notification_log_select_admin
  on public.support_notification_log
  for select
  to authenticated
  using (public.is_dashboard_admin());

-- Inserts/updates/deletes: SECURITY DEFINER trigger + service_role cron only.

-- ── credit balance crossing trigger ───────────────────────────────────────────

create or replace function public.support_notify_on_credit_balance_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.credit_alert_threshold is null then
    delete from public.support_notification_log
    where project_id = new.id
      and event_key = 'credit_low';
    return new;
  end if;

  if new.credit_balance >= new.credit_alert_threshold then
    delete from public.support_notification_log
    where project_id = new.id
      and event_key = 'credit_low';
    return new;
  end if;

  if new.credit_balance < new.credit_alert_threshold
     and (
       old.credit_balance >= new.credit_alert_threshold
       or not exists (
         select 1
         from public.support_notification_log log
         where log.project_id = new.id
           and log.event_key = 'credit_low'
       )
     )
  then
    insert into public.support_notification_log (
      notification_type,
      project_id,
      event_key,
      status
    )
    values (
      'credit_balance_low',
      new.id,
      'credit_low',
      'pending'
    )
    on conflict (notification_type, project_id, event_key)
    do update set
      status = 'pending',
      sent_at = null,
      created_at = now()
    where support_notification_log.status = 'sent';
  end if;

  return new;
end;
$$;

comment on function public.support_notify_on_credit_balance_change() is
  'After credit_balance update: clear credit_low log when restored above threshold; queue pending row on crossing below threshold.';

drop trigger if exists projects_support_notify_credit_balance on public.projects;

create trigger projects_support_notify_credit_balance
after update of credit_balance on public.projects
for each row
when (old.credit_balance is distinct from new.credit_balance)
execute procedure public.support_notify_on_credit_balance_change();
