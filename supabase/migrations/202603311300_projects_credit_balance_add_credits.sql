-- Per-project allocated credit pool and admin top-up via RPC.
-- SECURITY DEFINER bypasses RLS; caller must pass is_dashboard_admin().

alter table public.projects
  add column credit_balance integer not null default 0,
  add constraint projects_credit_balance_non_negative check (credit_balance >= 0);

comment on table public.projects is
  'Client engagements scoped to organizations. Each project has an allocated credit pool (credit_balance); used_credits tracks consumption against that pool.';

comment on column public.projects.credit_balance is
  'Allocated pool of credits for this project (admin top-ups increment this).';

comment on column public.projects.used_credits is
  'Credits consumed against this project''s credit_balance; usage may exceed balance until product rules enforce otherwise.';

create or replace function public.add_project_credits(p_project_id uuid, p_amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_dashboard_admin() then
    raise exception 'Only dashboard admins can add project credits.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be a positive integer.';
  end if;

  update public.projects
  set credit_balance = credit_balance + p_amount,
      updated_at = now()
  where id = p_project_id;

  if not found then
    raise exception 'Project not found.';
  end if;
end;
$$;

revoke all on function public.add_project_credits(uuid, integer) from public;
grant execute on function public.add_project_credits(uuid, integer) to authenticated;
