-- Follow-up: orphan orgs still appeared when the original trigger lived outside schema
-- `public` (e.g. auth.*), so it was never dropped and kept creating organizations.
-- Also harden admin_provisioned detection (jsonb boolean vs text) and accept the flag
-- from raw_user_meta_data (mirrored from the admin API for reliability).

do $drop_all_custom_auth_triggers$
declare
  rec record;
begin
  for rec in
    select t.tgname as trigger_name
    from pg_trigger t
    where t.tgrelid = 'auth.users'::regclass
      and not t.tgisinternal
  loop
    execute format('drop trigger if exists %I on auth.users', rec.trigger_name);
  end loop;
end $drop_all_custom_auth_triggers$;

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
  app jsonb;
  umeta jsonb;
  app_flag text;
  user_flag text;
begin
  app := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  umeta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  app_flag := lower(trim(coalesce(app->>'admin_provisioned', '')));
  user_flag := lower(trim(coalesce(umeta->>'admin_provisioned', '')));

  if app @> '{"admin_provisioned": true}'::jsonb
     or umeta @> '{"admin_provisioned": true}'::jsonb
     or app_flag in ('true', 't', '1')
     or user_flag in ('true', 't', '1') then
    return new;
  end if;

  org_display_name := coalesce(
    nullif(trim(umeta->>'full_name'), ''),
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
    nullif(trim(umeta->>'full_name'), ''),
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
