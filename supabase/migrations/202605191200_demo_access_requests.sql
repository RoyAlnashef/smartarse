-- Demo access requests: manual approval flow before magic-link provisioning.

-- Shared demo organization (set DEMO_ORGANIZATION_ID=a0000000-0000-4000-8000-0000000000d1 in env).
insert into public.organizations (id, name, slug, status)
values (
  'a0000000-0000-4000-8000-0000000000d1'::uuid,
  'Demo',
  'disrupt-demo',
  'active'
)
on conflict (id) do nothing;

create table if not exists public.demo_access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'pending'
    check (
      status in (
        'pending',
        'approved',
        'rejected',
        'magic_link_sent',
        'expired'
      )
    ),
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  magic_link_sent_at timestamptz,
  first_login_at timestamptz,
  user_id uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

comment on table public.demo_access_requests is
  'Prospect demo access requests; provisioned after Disrupt approval.';

create index if not exists demo_access_requests_email_idx
  on public.demo_access_requests (lower(email));

create index if not exists demo_access_requests_status_idx
  on public.demo_access_requests (status);

create index if not exists demo_access_requests_requested_at_idx
  on public.demo_access_requests (requested_at desc);

create unique index if not exists demo_access_requests_one_pending_per_email
  on public.demo_access_requests (lower(email))
  where status = 'pending';

alter table public.demo_access_requests enable row level security;

drop policy if exists demo_access_requests_select_admin on public.demo_access_requests;
create policy demo_access_requests_select_admin
  on public.demo_access_requests
  for select
  to authenticated
  using (public.is_dashboard_admin());

drop policy if exists demo_access_requests_update_admin on public.demo_access_requests;
create policy demo_access_requests_update_admin
  on public.demo_access_requests
  for update
  to authenticated
  using (public.is_dashboard_admin())
  with check (public.is_dashboard_admin());

-- Mark stale pending requests as expired (retain rows for reporting).
create or replace function public.expire_pending_demo_access_requests(p_ttl_days int default 7)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if p_ttl_days is null or p_ttl_days < 1 then
    p_ttl_days := 7;
  end if;

  update public.demo_access_requests
  set status = 'expired'
  where status = 'pending'
    and requested_at < now() - make_interval(days => p_ttl_days);

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.expire_pending_demo_access_requests(int) from public;
grant execute on function public.expire_pending_demo_access_requests(int) to service_role;
