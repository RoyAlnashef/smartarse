-- When an auth user is inserted, optionally create a default organization + public.users row.
-- Admin provisioning (POST /api/admin/users) sets app_metadata.admin_provisioned = true;
-- the app then upserts public.users with the chosen organization_id, so the trigger must no-op.
--
-- Drops existing non-internal triggers on auth.users whose trigger function lives in schema public
-- (typical Supabase "new user" setup), then installs a single replacement trigger.

do $drop_public_auth_triggers$
declare
  rec record;
begin
  for rec in
    select t.tgname as trigger_name
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    join pg_namespace fn on fn.oid = p.pronamespace
    where t.tgrelid = 'auth.users'::regclass
      and not t.tgisinternal
      and fn.nspname = 'public'
  loop
    execute format('drop trigger if exists %I on auth.users', rec.trigger_name);
  end loop;
end $drop_public_auth_triggers$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  new_org_id uuid;
  org_display_name text;
  base_slug text;
  new_slug text;
  display_name text;
begin
  if coalesce((new.raw_app_meta_data->>'admin_provisioned')::boolean, false) then
    return new;
  end if;

  org_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(new.email, 'user'), '@', 1),
    'Organization'
  );

  base_slug := lower(regexp_replace(org_display_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' or base_slug is null then
    base_slug := 'org';
  end if;
  new_slug := base_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.organizations (name, slug, status)
  values (org_display_name, new_slug, 'active')
  returning id into new_org_id;

  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'User'
  );

  insert into public.users (id, email, name, role, organization_id, status)
  values (new.id, new.email, display_name, 'user', new_org_id, 'active');

  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

grant usage on schema public to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;
