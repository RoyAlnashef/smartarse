# Task 2 — Authentication and Session Audit

**Status:** Complete | **Date:** 2026-06-10

## Scope

Files reviewed per [plan.md](../plan.md):

- `middleware.ts`
- `lib/auth-context.tsx`
- `lib/supabase/server.ts`, `client.ts`, `session-from-url.ts`, `fetch-user-profile.ts`
- `app/auth/callback/page.tsx`
- `components/login-page.tsx` (referenced)

## Methodology

Static review of session lifecycle: cookie refresh, magic-link callback, profile hydration, fallback paths, Bearer token handling in API helpers.

## Findings

| ID | Severity | Summary |
|----|----------|---------|
| SEC-001 | High | JWT/metadata/mock role fallback when `public.users` read fails |
| SEC-002 | High | Mock login without password when Supabase env missing |
| SEC-003 | Medium | Middleware refreshes session only; no route blocking |
| SEC-004 | Medium | Case-sensitive admin role in `requireDashboardAdmin` vs normalized RLS |

## Notes

**Session establishment:** `establishSessionFromUrl` correctly handles hash tokens and PKCE code exchange, then clears credentials from URL (`session-from-url.ts:50-60`). Magic-link flow in `auth/callback/page.tsx` is sound.

**Bearer tokens:** `requireDashboardAdmin` and `requireChatSession` accept session cookies or `Authorization: Bearer` JWT. Consistent pattern; increases token exposure surface (acceptable for API clients).

**Profile bootstrap:** README warns that `public.users` self-read RLS is required. Without it, SEC-001 activates — this is the highest-priority auth issue.

**Session fixation:** Supabase Auth handles token rotation; no custom session IDs observed.

**Open redirect:** Auth callback routes to `/client/projects`, `/auth/demo-setup`, or `record-first-login` redirectPath — all server-controlled paths; no user-supplied redirect parameter.

## API route coverage (auth helpers)

All sensitive routes delegate to shared helpers — see Task 3 matrix.
