# Authentication RBAC Foundation - Shaping Notes

## Scope

Build authentication and role-based access foundations for two user types:

- Admin (`admin`) with business label `disrupt`
- Client user (`client`) with business label `researcher`

Focus is auth/session + RBAC foundations only.

## Decisions

- Use Supabase-backed authentication as the session source of truth.
- Keep technical role keys as `admin` and `client` for policy and route checks.
- Add/maintain business-facing labels (`disrupt`, `researcher`) separately from policy keys.
- Preserve existing protected-shell redirect behavior and loading states while migrating from mock auth.
- Keep admin-created-user workflows out of this spec (future dashboard spec).
- Keep forgot-password link/reset flow out of this spec (future auth enhancement spec).

## Context

- **Visuals:** Existing login screenshot selected:
  - `agent-os/specs/2026-03-17-1200-sign-in-client-theme/visuals/login-92f86370-3347-4a71-902c-6279755c3bea.png`
- **References:**
  - `/Users/royalnashef/Desktop/smart-arse/lib/auth-context.tsx`
  - `/Users/royalnashef/Desktop/smart-arse/components/login-page.tsx`
- **Product alignment:**
  - Mission: role-separated admin/client platform use.
  - Roadmap: MVP includes auth/session/user management UI and RBAC protected routes.
  - Tech stack: Supabase Auth + RLS target, with client role checks as UX layer only.

## Standards Applied

- `javascript/auth-rbac` - canonical role and `useAuth` behavior, page-level RBAC, migration notes.
- `global/app-routing-protected-shell` - route group patterns, redirects, loading UX, protected shell expectations.
- `global/project-conventions` - import boundaries, client component usage, naming and product-copy conventions.

## Deferred Follow-Ups

- Add admin dashboard flow for creating admin/client users.
