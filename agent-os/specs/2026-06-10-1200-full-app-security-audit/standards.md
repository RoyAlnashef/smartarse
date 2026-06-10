# Standards for Full Application Security Audit

This audit uses **OWASP-oriented checklists and general security best practices**, not agent-os project standards. Findings are mapped to the categories below.

---

## 1. Authentication (OWASP ASVS V2)

- Verify all authentication endpoints require credentials or valid tokens
- Session tokens must be invalidated on logout
- Password reset and magic-link flows must use time-limited, single-use tokens
- No authentication bypass via fallback paths (mock users, JWT metadata when DB read fails)
- Multi-factor authentication posture documented (if not implemented, note as gap)
- Session cookies: `HttpOnly`, `Secure`, `SameSite` where applicable (Supabase SSR handles most)
- No credentials or session identifiers in URLs (except one-time magic-link fragments handled server-side)

**App-specific checks:**

- `middleware.ts` — session refresh without route blocking
- `lib/auth-context.tsx` — profile hydration and fallback behavior
- `lib/supabase/session-from-url.ts` — magic-link callback handling
- Demo password setup and first-login flows under `app/api/demo/*`

---

## 2. Authorization (OWASP ASVS V4)

- Every API route must enforce authorization before business logic
- Role checks must be server-side (RLS + route handlers), not client-only
- Principle of least privilege for service-role usage
- Horizontal privilege escalation prevented (org/project ID tampering in request body or URL)
- Admin operations require verified admin role, not just UI hiding
- Shared-secret endpoints (cron, n8n callback, demo email links) use constant-time comparison

**App-specific checks:**

- `lib/api/require-dashboard-admin.ts`
- `lib/api/require-chat-session.ts`
- `lib/api/authorize-cron-request.ts`
- All routes under `app/api/admin/**`, `app/api/cron/**`, `app/api/demo/**`
- Supabase RLS policies in `supabase/migrations/`

---

## 3. Data Protection (OWASP ASVS V8)

- Sensitive data encrypted in transit (HTTPS assumed in production)
- Row-level security enforces org/project isolation at the database layer
- Service-role key never exposed to client bundle
- Storage bucket policies prevent cross-project file access
- SECURITY DEFINER functions validate caller identity inside the function body
- No PII logged to client-visible errors or server logs in production

**App-specific checks:**

- RLS migrations (`is_dashboard_admin()`, `auth_user_can_read_project()`)
- Storage RLS helpers in `202603261600_storage_project_docs_rls_helpers.sql`
- Client-side Supabase modules in `lib/supabase/*`

---

## 4. Input Validation (OWASP ASVS V5)

- All mutation endpoints validate input with schema (prefer Zod)
- UUID path parameters validated before database queries
- File upload names sanitized; content types and sizes constrained
- No raw user input forwarded to external services without validation
- SQL injection prevented (parameterized queries via Supabase client)
- XSS prevented in rendered user content (React default escaping; audit rich text if any)

**App-specific checks:**

- Zod schemas in chat, demo, admin, focus-group routes
- Pass-through body in `app/api/n8n/route.ts`
- `sanitizeStorageFileName` in document/persona upload paths

---

## 5. Configuration and Secrets (OWASP ASVS V14)

- Secrets stored in environment variables, never committed to source
- Server-only secrets not prefixed with `NEXT_PUBLIC_`
- Missing env vars fail safely (503/500, not silent bypass)
- Third-party API keys scoped to minimum required permissions
- Cron and webhook secrets rotated independently
- No secrets inlined in scripts, tests, or command-line examples

**App-specific checks:**

- `README.md` env documentation
- `lib/n8n-webhook-url.ts` — `NEXT_PUBLIC_N8N_*` fallback risk
- `lib/supabase/admin.ts` — service role key usage
- Archived handover note on n8n JWT leak incident

---

## 6. API Security (OWASP API Security Top 10)

| Risk | Check |
|------|-------|
| Broken object level authorization | IDOR on `[id]` params in admin/chat/demo routes |
| Broken authentication | Missing auth on any route handler |
| Unrestricted resource consumption | Rate limits on public demo endpoints |
| Security misconfiguration | Cron schedule vs auth, CORS, error verbosity |
| Unsafe consumption of APIs | n8n proxy forwarding unvalidated payloads |
| Server-side request forgery | n8n webhook URL from env only (not user-controlled) |

---

## 7. Client-Side Security

- No role elevation via client state manipulation
- Dev/demo features gated in production builds
- No sensitive operations relying solely on obscured UI
- CSRF posture for cookie-authenticated state-changing requests documented
- Public env vars limited to Supabase anon key (RLS-dependent) and app URL

**App-specific checks:**

- `app/(dashboard)/layout.tsx`, `app/client/layout.tsx`
- `components/layout/sidebar.tsx` — demo role switcher
- GET endpoints with side effects (`app/api/demo/approve`, `reject`)

---

## 8. Dependency and Supply Chain

- Run `npm audit` and document Critical/High CVEs
- Pin or update vulnerable transitive dependencies
- No known-vulnerable packages in production dependencies without mitigation

---

## 9. Logging and Error Handling

- Generic error messages to clients on auth failures (anti-enumeration)
- No stack traces or internal paths in production API responses
- Failed auth attempts do not leak whether a resource exists (where feasible)

**App-specific checks:**

- `app/api/demo/request/route.ts` — generic success response
- Consistent 401/403 patterns across API helpers

---

## Finding Documentation Standard

Each finding in the technical appendix must include:

1. **ID** — e.g. `SEC-001`
2. **Severity** — Critical / High / Medium / Low / Informational
3. **Category** — Auth, Authorization, Data, Config, Validation, Client, Dependency
4. **Location** — `file:line` or migration filename
5. **Description** — What the issue is
6. **Impact** — What an attacker could achieve
7. **Recommendation** — How to fix
8. **Status** — Open / Fixed / Accepted risk
