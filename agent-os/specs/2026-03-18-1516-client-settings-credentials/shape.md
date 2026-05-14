# Client Settings + Credentials — Shaping Notes

## Scope
Build settings/credentials UI for `client` users to manage:
- Credentials: mock “Change Password” and display basic profile information.
- SaaS preferences: notifications toggles, privacy/data export, and billing/usage summary placeholders.

Selected constraints for this MVP iteration:
- `password` + `basic profile` only (no external credentials like API keys / OAuth).
- Settings are scoped per client org/tenant (`clientId`), not per project.
- Mock persistence only: “Save” updates UI state and writes to `sessionStorage` for the current session.
- No real backend/API integration (Supabase) in this iteration.

## Decisions
- Keep admin and client surfaces separate:
  - Admin continues to use `app/(dashboard)/settings/page.tsx`.
  - Client/user settings uses a dedicated client route at `app/client/settings/page.tsx`.
- Routing/redirect behavior should follow existing shell patterns:
  - Client layout enforces login and redirects `admin` to `/dashboard`.
  - Admin layout enforces login only (page-level RBAC stays on pages).
- Use existing app conventions:
  - `useAuth()` for user context and client scoping (`getClientForUser()`).
  - UI styling should use the standard shadcn primitives + `cn()` / focus ring patterns.
- Privacy/billing pages/actions are placeholders:
  - Provide links and mock “export” action that downloads a JSON blob (client-side).

## Context
- Visual reference: provided screenshot from the conversation (see `visuals/README.md`).
- Existing references:
  - Admin settings route: `app/(dashboard)/settings/page.tsx` (current UI stub).
  - Client header chrome: `components/client/client-shell-header.tsx` (Settings icon currently “coming soon”).
  - Client shell theme: `app/client/layout.tsx`.
  - Auth/session mocks: `lib/auth-context.tsx`, `lib/mock-data.ts`, `lib/types.ts`.

## Product alignment
- `smartA.R.S.E.` targets separate admin workflows vs client experience and supports client-side management of settings and credentials in the client area.
- Credit-related context (credits/usage display) belongs naturally in the client shell and should be presented as read-only summary in settings for now.

## Standards Applied
- `css/ui-styling`
- `global/app-routing-protected-shell`
- `global/domain-data-layer`
- `global/project-conventions`
- `javascript/auth-rbac`

