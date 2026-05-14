-- Dashboard admins can decrement a project's allocated credit pool (mirror of add_project_credits).

create or replace function public.remove_project_credits(p_project_id uuid, p_amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_dashboard_admin() then
    raise exception 'Only dashboard admins can remove project credits.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be a positive integer.';
  end if;

  update public.projects
  set credit_balance = credit_balance - p_amount,
      updated_at = now()
  where id = p_project_id
    and credit_balance >= p_amount;

  if not found then
    if exists (select 1 from public.projects where id = p_project_id) then
      raise exception 'Cannot remove more credits than are available in this project''s balance.';
    else
      raise exception 'Project not found.';
    end if;
  end if;
end;
$$;

revoke all on function public.remove_project_credits(uuid, integer) from public;
grant execute on function public.remove_project_credits(uuid, integer) to authenticated;
