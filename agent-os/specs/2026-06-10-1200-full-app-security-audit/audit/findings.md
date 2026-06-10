# Security Audit — Findings Register

Findings from Tasks 2–6 (static review). Remediated in Task 8 (June 2026).

| ID | Severity | Category | Location | Summary | Status |
|----|----------|----------|----------|---------|--------|
| SEC-001 | High | Auth | `lib/auth-context.tsx` | Role/org derived from JWT metadata or mock data when `public.users` read fails | Fixed |
| SEC-002 | High | Auth | `lib/auth-context.tsx` | Mock login accepts any password when Supabase env is missing | Fixed |
| SEC-003 | Medium | Auth | `middleware.ts` | No route-level auth enforcement; session refresh only | Fixed |
| SEC-004 | Medium | Auth | `lib/api/require-dashboard-admin.ts` | Admin role check case-sensitive vs RLS | Fixed |
| SEC-005 | Medium | Authorization | Cron routes | Cron auth duplicated inline | Fixed |
| SEC-006 | Low | Authorization | Admin demo `[id]` routes | Route `id` not UUID-validated | Fixed |
| SEC-007 | Medium | Validation | `app/api/n8n/route.ts` | Unvalidated body forwarded to n8n | Fixed |
| SEC-008 | High | Authorization | `app/api/chat/n8n-complete/route.ts` | Callback secret blast radius | Accepted risk |
| SEC-009 | Low | Authorization | Demo approve/reject GET | State-changing GET endpoints | Accepted risk |
| SEC-010 | Medium | Data | `chat_results` RLS | Null `project_id` rows org-visible | Fixed |
| SEC-011 | Low | Data | `auth_user_can_read_project` | Case-sensitive role match | Fixed |
| SEC-012 | Medium | Config | `lib/n8n-webhook-url.ts` | Public env fallback for webhook URL | Fixed |
| SEC-013 | Low | Config | Cron auth | Non-timing-safe secret compare | Fixed |
| SEC-014 | Informational | Config | Repository root | No `.env.example` | Fixed |
| SEC-015 | Medium | Client | `sidebar.tsx` | Demo role switcher in production | Fixed |
| SEC-016 | Medium | Client | Dashboard/client layouts | Client-only layout RBAC | Fixed |
| SEC-017 | Low | Validation | Upload sanitization | Minimal filename sanitization | Fixed |
| SEC-018 | Informational | Validation | Cookie POST routes | No explicit CSRF tokens | Accepted risk |
| SEC-019 | High | Dependency | `next` | Vulnerable Next.js version | Fixed |
| SEC-020 | Critical | Dependency | `vitest` (dev) | Vitest UI vulnerability | Fixed |
| SEC-021 | High | Dependency | `lodash` via recharts | Lodash advisory | Fixed |
| SEC-022 | High | Dependency | `picomatch` transitive | ReDoS in build tooling | Fixed |

---

## SEC-001 — JWT/metadata role fallback when profile read fails

**Severity:** High | **Category:** Auth | **Status:** Fixed

**Location:** `lib/auth-context.tsx:55-65`, `129-132`

**Description:** When `fetchPublicUserRow` fails or returns null, `buildUserFromSession` falls back to `app_metadata.role`, `user_metadata.role`, or mock email match. A user whose `public.users` row is unreadable (misconfigured RLS, provisioning gap) may receive an incorrect role in the UI and be routed to the wrong shell.

**Impact:** Wrong dashboard/client routing; misleading UI permissions. Server APIs still enforce real role via DB, but user experience and any client-only checks could be wrong.

**Recommendation:** Fail closed: if authenticated session exists but profile row cannot be loaded, treat as unauthenticated or show a blocking error. Never derive role from JWT metadata in production.

---

## SEC-002 — Mock login without password verification

**Severity:** High | **Category:** Auth | **Status:** Fixed

**Location:** `lib/auth-context.tsx:146-160`

**Description:** When `getSupabaseBrowserClient()` returns null (missing `NEXT_PUBLIC_SUPABASE_*`), `login()` matches email against mock `users` and ignores the password argument entirely.

**Impact:** If Supabase env vars are missing in a deployed environment, anyone knowing a mock user email gains access.

**Recommendation:** Remove mock login path in production builds (`NODE_ENV === 'production'`). Fail with configuration error instead.

---

## SEC-003 — Middleware does not enforce authentication

**Severity:** Medium | **Category:** Auth | **Status:** Fixed

**Location:** `middleware.ts`

**Description:** Middleware only refreshes Supabase cookies via `getUser()`. Unauthenticated requests reach all pages and API routes.

**Impact:** Acceptable if every sensitive route self-guards. Any unguarded page/API is publicly reachable.

**Recommendation:** Document as accepted pattern OR add middleware matchers for `/api/admin/*`, `/(dashboard)/*` redirect to login. Audit confirms API routes are guarded; page routes use client layouts.

---

## SEC-004 — Case-sensitive admin role check in API helper

**Severity:** Medium | **Category:** Auth | **Status:** Fixed

**Location:** `lib/api/require-dashboard-admin.ts:89`

**Description:** API checks `adminRow?.role !== "admin"` (exact). Database RLS uses `lower(trim(u.role)) = 'admin'`.

**Impact:** A profile with role `Admin` might pass RLS mutations from browser client but fail admin API routes (or vice versa depending on data).

**Recommendation:** Normalize role comparison: `lower(trim(adminRow.role)) === 'admin'`.

---

## SEC-005 — Inconsistent cron authentication

**Severity:** Medium | **Category:** Authorization | **Status:** Fixed

**Location:** `app/api/cron/pause-expired-projects/route.ts:16-27`, `app/api/cron/expire-demo-requests/route.ts:14-27` vs `lib/api/authorize-cron-request.ts`

**Description:** Two cron routes duplicate inline Bearer checks. Support-notification cron routes use shared `authorizeCronRequest`.

**Impact:** Auth logic drift over time; harder to audit. Functional risk is low if logic stays identical.

**Recommendation:** Refactor both routes to call `authorizeCronRequest(request)`.

---

## SEC-006 — Admin demo approve/reject missing UUID validation

**Severity:** Low | **Category:** Authorization | **Status:** Fixed

**Location:** `app/api/admin/demo-requests/[id]/approve/route.ts:20`, `reject/route.ts`

**Description:** `id` route param passed directly to `approveDemoAccessRequest` without UUID schema validation (unlike `DELETE /api/admin/users/[id]`).

**Impact:** Invalid IDs cause DB errors; minimal security impact due to admin auth gate.

**Recommendation:** Add `z.string().uuid()` validation consistent with other admin `[id]` routes.

---

## SEC-007 — Unvalidated n8n proxy request body

**Severity:** Medium | **Category:** Validation | **Status:** Fixed

**Location:** `app/api/n8n/route.ts:33-57`

**Description:** Only `request_id` type is checked. Full JSON body is forwarded to external n8n webhook.

**Impact:** Authenticated user could send oversized payloads, unexpected fields, or probe n8n behavior. n8n secret is server-side (good).

**Recommendation:** Add Zod schema matching chat webhook contract; enforce max body size.

---

## SEC-008 — n8n callback service-role write blast radius

**Severity:** High | **Category:** Authorization | **Status:** Accepted risk

**Location:** `app/api/chat/n8n-complete/route.ts:106-386`

**Description:** Valid callback secret grants service-role upsert to `chat_results` for any `user_id`/`organization_id` pair that passes validation. Attacker with leaked secret can write chat results for users in any org.

**Impact:** Data integrity compromise across tenants if `CHAT_N8N_CALLBACK_SECRET` leaks.

**Recommendation:** Accept risk with secret rotation docs; optionally bind callback to IP allowlist or sign payload with per-request HMAC. Ensure secret is high-entropy and not logged.

---

## SEC-009 — State-changing GET for demo email actions

**Severity:** Low | **Category:** Authorization | **Status:** Accepted risk

**Location:** `app/api/demo/approve/route.ts`, `app/api/demo/reject/route.ts`

**Description:** Approval/rejection triggered via GET with HMAC token in query string.

**Impact:** CSRF not applicable to email links; token may leak via Referer/logs if user navigates away to external HTTP site.

**Recommendation:** Document accepted pattern; consider POST with one-time form for defense in depth.

---

## SEC-010 — Org-wide visibility of unscoped chat_results

**Severity:** Medium | **Category:** Data | **Status:** Fixed

**Location:** `supabase/migrations/202603311200_chat_results.sql:56-57`

**Description:** RLS allows any active org member to SELECT rows where `project_id IS NULL` and `organization_id` matches.

**Impact:** Legacy/orphan chat rows may expose queries to all org users rather than project-assigned users.

**Recommendation:** Confirm no new rows are written with null `project_id`; migrate legacy rows; tighten policy to require project scope.

---

## SEC-011 — Case-sensitive role in project access helper

**Severity:** Low | **Category:** Data | **Status:** Fixed

**Location:** `supabase/migrations/202603251200_fix_projects_rls_recursion.sql:19,32`

**Description:** `auth_user_can_read_project` checks `u.role = 'client'` and `'user'` exactly.

**Impact:** Non-normalized role values in DB could deny legitimate access or behave inconsistently with admin helper.

**Recommendation:** Use `lower(trim(u.role::text))` consistent with `is_dashboard_admin()`.

---

## SEC-012 — Public env fallback for n8n webhook URL

**Severity:** Medium | **Category:** Config | **Status:** Fixed

**Location:** `lib/n8n-webhook-url.ts:17-20`

**Description:** Server config falls back to `NEXT_PUBLIC_N8N_URL` / `NEXT_PUBLIC_N8N_WEBHOOK_URL`.

**Impact:** Webhook URL embedded in client JavaScript bundle if those vars are set, exposing infrastructure endpoint.

**Recommendation:** Remove public env fallbacks; require `N8N_WEBHOOK_URL` server-only.

---

## SEC-013 — Cron secret not compared in constant time

**Severity:** Low | **Category:** Config | **Status:** Fixed

**Location:** Inline cron routes

**Description:** `token !== expected` is not timing-safe (unlike n8n callback and demo HMAC).

**Impact:** Theoretical timing side-channel; low practical risk for cron Bearer tokens.

**Recommendation:** Use same SHA-256 + `timingSafeEqual` pattern as `n8n-complete`.

---

## SEC-014 — Missing .env.example

**Severity:** Informational | **Category:** Config | **Status:** Fixed

**Location:** Repository root

**Description:** Secrets documented in README but no template env file in repo.

**Impact:** Deployment misconfiguration (missing RLS self-read, missing CRON_SECRET).

**Recommendation:** Add `.env.example` with all required vars (no values).

---

## SEC-015 — Demo role switcher in production UI

**Severity:** Medium | **Category:** Client | **Status:** Fixed

**Location:** `components/layout/sidebar.tsx:122-128`

**Description:** "Demo Role" buttons call `switchRole()` swapping mock user in client state without changing Supabase session.

**Impact:** Does not bypass server auth, but confuses admins and could mask real role during testing on production.

**Recommendation:** Hide behind `process.env.NODE_ENV === 'development'` or remove.

---

## SEC-016 — Client-only layout RBAC

**Severity:** Medium | **Category:** Client | **Status:** Fixed

**Location:** `app/(dashboard)/layout.tsx:27-29`, `app/client/layout.tsx`

**Description:** Admin/client shells redirect based on `user.role` from auth context (which may be wrong per SEC-001).

**Impact:** UX/routing issue; direct API/RLS still protects data.

**Recommendation:** Fix SEC-001; optionally add server-side layout guards via middleware.

---

## SEC-017 — Minimal upload filename sanitization

**Severity:** Low | **Category:** Validation | **Status:** Fixed

**Location:** `lib/supabase/documents.ts:66-68`

**Description:** Sanitization replaces `/\` and leading dots only; no null-byte strip, no allowlist of extensions at upload layer.

**Impact:** Storage RLS binds path to project ID prefix; limited traversal risk. MIME spoofing possible.

**Recommendation:** Allowlist extensions (pdf/csv/xlsx); validate file size server-side; strip null bytes.

---

## SEC-018 — No explicit CSRF protection

**Severity:** Informational | **Category:** Validation | **Status:** Accepted risk

**Location:** Cookie-session POST routes

**Description:** Mutations use Supabase session cookies without CSRF tokens.

**Impact:** Mitigated by SameSite=Lax/Strict on modern browsers; cross-site POST from malicious site remains a consideration.

**Recommendation:** Document accepted risk; ensure Supabase cookie SameSite settings are Strict where compatible.

---

## SEC-019 — Vulnerable Next.js version

**Severity:** High | **Category:** Dependency | **Status:** Fixed

**Location:** `package.json` — `next@16.1.6`

**Description:** `pnpm audit` reports multiple HIGH advisories affecting Next.js 16.0.0–16.2.4 (DoS, cache poisoning). Patched in `>=16.2.5`.

**Impact:** Production DoS or cache-related attacks depending on deployment.

**Recommendation:** Upgrade Next.js to `>=16.2.5`.

---

## SEC-020 — Vulnerable Vitest version (dev)

**Severity:** Critical | **Category:** Dependency | **Status:** Fixed

**Location:** `package.json` — `vitest@3.0.5`

**Description:** GHSA-5xrq-8626 — arbitrary file read/execute when Vitest UI server is listening.

**Impact:** Dev/CI only; no production runtime exposure unless Vitest UI exposed.

**Recommendation:** Upgrade vitest to `>=3.2.6`.

---

## SEC-021 — Lodash via recharts

**Severity:** High | **Category:** Dependency | **Status:** Fixed

**Location:** `recharts>lodash`

**Description:** Lodash `_.template` code injection (GHSA-r5fr-rjxr-66jc).

**Impact:** Low if `_.template` not used in app code paths; transitive risk.

**Recommendation:** Upgrade recharts or override lodash to `>=4.18.0`.

---

## SEC-022 — Picomatch ReDoS (transitive)

**Severity:** High | **Category:** Dependency | **Status:** Fixed

**Location:** `tailwindcss>picomatch`

**Description:** ReDoS in build tooling dependency chain.

**Impact:** Dev/build-time primarily.

**Recommendation:** Update tailwindcss / lockfile overrides for picomatch `>=4.0.4` / `>=2.3.2`.

---

## Positive Observations

- All `/api/admin/*` routes use `requireDashboardAdmin` before service-role access.
- All `/api/chat/*`, `/api/n8n`, focus-group, audience, credits routes use `requireChatSession`.
- `chat/poll`, `chat/result` verify `user_id` matches session profile.
- `chat/persist` validates project via user-scoped Supabase client (RLS-enforced).
- Demo approval tokens use HMAC + `timingSafeEqual`.
- n8n callback uses Zod validation + org/project/user cross-checks.
- Demo request endpoint uses anti-enumeration generic responses + rate limiting (3/hour/email).
- RLS foundation (`is_dashboard_admin`, `auth_user_can_read_project`, storage helpers) is well-structured.
- `users_select_self_or_admin` policy enables secure profile bootstrap.
