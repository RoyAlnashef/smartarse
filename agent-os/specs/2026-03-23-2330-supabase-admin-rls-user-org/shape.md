# Supabase Admin RLS + User/Org Create — Shaping Notes

## Scope

Add admin-only create/edit capabilities for:

- `public.organizations` (create + update from dashboard)
- `public.users` management surface (admin editing, plus new user creation flow)

And wire dashboard flows so admin can:

- Create organization from `/organizations`
- Create user from `/users` with a temporary password

## Decisions

- Create/edit policies are admin-only.
- User creation is done server-side using service role (never from browser anon key).
- Keep current dashboard UI structure; only add missing behavior.
- Use temporary password onboarding for newly created users.

## Context

- **Visuals:** Runtime error and Add User modal screenshots are captured in `visuals/README.md`.
- **References:** Existing organization/user dashboard and supabase data-layer files are listed in `references.md`.
- **Product alignment:** Role-aware app with server-enforced authorization.

## Constraints

- Do not rely on client-side role checks alone.
- Preserve admin-only page access behavior already in dashboard pages.
- Keep TypeScript domain mappings aligned with Supabase-backed data.

## Standards Applied

- `javascript/auth-rbac` — roles and server-side enforcement expectations.
- `global/domain-data-layer` — type/schema alignment and relation integrity.
