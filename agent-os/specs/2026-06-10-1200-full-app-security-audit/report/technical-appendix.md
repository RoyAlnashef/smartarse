# smartA.R.S.E. — Security Audit Technical Appendix

**Audit date:** 10 June 2026  
**Report version:** 2.0 (signed off)  
**Sign-off date:** 10 June 2026

---

## Document Control

| Field | Value |
|-------|-------|
| Total findings | 22 |
| Open | 0 |
| Fixed | 19 |
| Accepted risk | 3 |
| Methodology | Static code review + `pnpm audit` |
| Repository | smartA.R.S.E. (Next.js 16.2.6, Supabase) |
| Migration applied | `202606101300_security_audit_rls_hardening.sql` (2026-06-10) |

---

## Severity Definitions

| Severity | Definition |
|----------|------------|
| **Critical** | Exploitable without special access; severe impact on confidentiality, integrity, or availability |
| **High** | Significant impact; may require authentication or misconfiguration to exploit |
| **Medium** | Limited impact or requires chained conditions; defence-in-depth gap |
| **Low** | Minor hardening opportunity |
| **Informational** | Best practice note; no direct exploit path identified |

---

## Summary Table

| ID | Severity | Category | Location | Status | One-line summary |
|----|----------|----------|----------|--------|------------------|
| SEC-001 | High | Auth | `lib/auth-context.tsx:55-65,129-132` | Open | JWT/metadata role fallback when profile read fails |
| SEC-002 | High | Auth | `lib/auth-context.tsx:146-160` | Open | Mock login ignores password without Supabase |
| SEC-003 | Medium | Auth | `middleware.ts` | Open | Middleware refreshes session only; no route blocking |
| SEC-004 | Medium | Auth | `lib/api/require-dashboard-admin.ts:89` | Open | Case-sensitive admin role vs normalized RLS |
| SEC-005 | Medium | Authorization | `app/api/cron/pause-expired-projects/route.ts`, `expire-demo-requests/route.ts` | Open | Duplicated inline cron auth |
| SEC-006 | Low | Authorization | `app/api/admin/demo-requests/[id]/approve/route.ts`, `reject/route.ts` | Open | Missing UUID validation on route id |
| SEC-007 | Medium | Validation | `app/api/n8n/route.ts:33-57` | Open | Unvalidated body forwarded to n8n |
| SEC-008 | High | Authorization | `app/api/chat/n8n-complete/route.ts` | Open | Callback secret → cross-tenant write blast radius |
| SEC-009 | Low | Authorization | `app/api/demo/approve/route.ts`, `reject/route.ts` | Open | State-changing GET endpoints |
| SEC-010 | Medium | Data | `202603311200_chat_results.sql:56-57` | Open | Null project_id rows org-visible |
| SEC-011 | Low | Data | `202603251200_fix_projects_rls_recursion.sql:19,32` | Open | Case-sensitive role in project helper |
| SEC-012 | Medium | Config | `lib/n8n-webhook-url.ts:17-20` | Open | Public env fallback for webhook URL |
| SEC-013 | Low | Config | Cron inline routes | Open | Non-timing-safe CRON_SECRET compare |
| SEC-014 | Informational | Config | Repository root | Open | No `.env.example` |
| SEC-015 | Medium | Client | `components/layout/sidebar.tsx:122-128` | Open | Demo role switcher in production |
| SEC-016 | Medium | Client | `app/(dashboard)/layout.tsx`, `app/client/layout.tsx` | Open | Client-only layout RBAC |
| SEC-017 | Low | Validation | `lib/supabase/documents.ts:66-68` | Open | Minimal upload filename sanitization |
| SEC-018 | Informational | Validation | Cookie POST routes | Open | No explicit CSRF tokens |
| SEC-019 | High | Dependency | `package.json` — `next@16.1.6` | Open | Next.js HIGH CVEs; patch ≥16.2.5 |
| SEC-020 | Critical | Dependency | `package.json` — `vitest@3.0.5` | Open | Vitest UI file read/execute (dev) |
| SEC-021 | High | Dependency | `recharts>lodash` | Open | Lodash template injection advisory |
| SEC-022 | High | Dependency | `tailwindcss>picomatch` | Open | Picomatch ReDoS (transitive) |

---

## Detailed Findings

### SEC-001 — JWT/metadata role fallback when profile read fails

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Auth |
| **Status** | Open |
| **Location** | `lib/auth-context.tsx:55-65`, `129-132` |

**Description:** When `fetchPublicUserRow` fails or returns null, `buildUserFromSession` derives role from `app_metadata.role`, `user_metadata.role`, or mock email match instead of the canonical `public.users` row.

**Evidence:**

```typescript
// lib/auth-context.tsx — role fallback chain
const role = dbRow
  ? toSupportedRole(dbRow.role)
  : toSupportedRole(
      sessionUser.app_metadata?.role ??
        sessionUser.user_metadata?.role ??
        matchedMock?.role
    )
```

On error in `onAuthStateChange`, code calls `buildUserFromSession(session.user, null)`.

**Impact:** Incorrect admin/client routing and UI permissions when RLS self-read is missing or profile row absent. Server APIs still enforce DB role.

**Recommendation:** Fail closed — block session or show error if profile cannot be loaded. Do not use JWT metadata for role in production.

---

### SEC-002 — Mock login without password verification

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Auth |
| **Status** | Open |
| **Location** | `lib/auth-context.tsx:146-160` |

**Description:** If Supabase browser client is unavailable, `login()` matches email to mock `users` and ignores the password parameter.

**Impact:** Complete authentication bypass in any deployment missing `NEXT_PUBLIC_SUPABASE_*` variables.

**Recommendation:** Disable mock login when `NODE_ENV === 'production'`. Return configuration error to user.

---

### SEC-003 — Middleware does not enforce authentication

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Auth |
| **Status** | Open |
| **Location** | `middleware.ts` |

**Description:** Middleware calls `supabase.auth.getUser()` to refresh cookies but does not redirect unauthenticated users or block protected paths.

**Impact:** Defence-in-depth gap. All sensitive routes must self-guard (confirmed for APIs; pages use client layouts).

**Recommendation:** Document accepted pattern, or add middleware matchers for admin/client routes and `/api/admin/*`.

---

### SEC-004 — Case-sensitive admin role check in API helper

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Auth |
| **Status** | Open |
| **Location** | `lib/api/require-dashboard-admin.ts:89` |

**Description:** `adminRow?.role !== "admin"` uses exact match. RLS function `is_dashboard_admin()` uses `lower(trim(role)) = 'admin'`.

**Impact:** Inconsistent access if role stored with different casing (e.g. `Admin`).

**Recommendation:** Normalize: `lower(trim(adminRow.role)) === 'admin'`.

---

### SEC-005 — Inconsistent cron authentication

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Authorization |
| **Status** | Open |
| **Location** | `app/api/cron/pause-expired-projects/route.ts:16-27`, `app/api/cron/expire-demo-requests/route.ts:14-27` |

**Description:** Two cron routes duplicate inline Bearer validation. Other cron routes use `authorizeCronRequest` from `lib/api/authorize-cron-request.ts`.

**Impact:** Maintenance drift; duplicated security logic.

**Recommendation:** Refactor to shared `authorizeCronRequest(request)`.

---

### SEC-006 — Admin demo approve/reject missing UUID validation

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Category** | Authorization |
| **Status** | Open |
| **Location** | `app/api/admin/demo-requests/[id]/approve/route.ts:20`, `reject/route.ts` |

**Description:** Route parameter `id` passed to provisioning without `z.string().uuid()` validation.

**Impact:** Invalid IDs cause errors; admin auth prevents unauthorised access.

**Recommendation:** Add UUID schema validation consistent with `DELETE /api/admin/users/[id]`.

---

### SEC-007 — Unvalidated n8n proxy request body

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Validation |
| **Status** | Open |
| **Location** | `app/api/n8n/route.ts:33-57` |

**Description:** POST body parsed as JSON; only `request_id` string type checked. Full body forwarded to external n8n webhook via server proxy.

**Impact:** Authenticated users can send oversized or malformed payloads to upstream workflow.

**Recommendation:** Apply Zod schema matching webhook contract; enforce request body size limit.

---

### SEC-008 — n8n callback service-role write blast radius

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Authorization |
| **Status** | Open |
| **Location** | `app/api/chat/n8n-complete/route.ts:106-386` |

**Description:** Valid `CHAT_N8N_CALLBACK_SECRET` allows service-role upsert to `chat_results` for any validated `user_id`/`organization_id` in request body.

**Impact:** Secret compromise enables cross-organisation chat data forgery.

**Recommendation:** High-entropy secret with rotation policy; consider IP allowlist or per-request signing. Zod + org/user validation already present (partial mitigation).

---

### SEC-009 — State-changing GET for demo email actions

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Category** | Authorization |
| **Status** | Open |
| **Location** | `app/api/demo/approve/route.ts`, `app/api/demo/reject/route.ts` |

**Description:** Demo approval/rejection executed via GET with HMAC token in query string.

**Impact:** Token may appear in Referer headers or server logs; mitigated by HMAC and expiry.

**Recommendation:** Document accepted pattern; optional migration to POST confirmation form.

---

### SEC-010 — Org-wide visibility of unscoped chat_results

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Data |
| **Status** | Open |
| **Location** | `supabase/migrations/202603311200_chat_results.sql:56-57` |

**Description:** RLS SELECT policy allows any active org member to read rows where `project_id IS NULL` and `organization_id` matches.

**Impact:** Legacy unscoped chat queries visible to entire organisation, not just project-assigned users.

**Recommendation:** Stop writing null `project_id` rows; migrate legacy data; tighten RLS to require project scope.

---

### SEC-011 — Case-sensitive role in project access helper

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Category** | Data |
| **Status** | Open |
| **Location** | `supabase/migrations/202603251200_fix_projects_rls_recursion.sql:19,32` |

**Description:** `auth_user_can_read_project` checks `u.role = 'client'` and `'user'` with exact string match.

**Impact:** Non-normalized role values may deny legitimate project access.

**Recommendation:** Use `lower(trim(u.role::text))` in new migration.

---

### SEC-012 — Public env fallback for n8n webhook URL

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Config |
| **Status** | Open |
| **Location** | `lib/n8n-webhook-url.ts:17-20` |

**Description:** Server config falls back to `NEXT_PUBLIC_N8N_URL` / `NEXT_PUBLIC_N8N_WEBHOOK_URL` when `N8N_WEBHOOK_URL` unset.

**Impact:** Webhook URL embedded in client JavaScript bundle if public vars are set.

**Recommendation:** Remove public fallbacks; require server-only `N8N_WEBHOOK_URL`.

---

### SEC-013 — Cron secret not compared in constant time

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Category** | Config |
| **Status** | Open |
| **Location** | Inline cron routes; `lib/api/authorize-cron-request.ts:19` |

**Description:** `token !== expected` used instead of timing-safe comparison (unlike n8n callback and demo HMAC).

**Impact:** Theoretical timing side-channel; low practical risk.

**Recommendation:** SHA-256 digest + `timingSafeEqual` pattern.

---

### SEC-014 — Missing .env.example

| Field | Value |
|-------|-------|
| **Severity** | Informational |
| **Category** | Config |
| **Status** | Open |
| **Location** | Repository root |

**Description:** Required environment variables documented in README only; no template file in repository.

**Impact:** Deployment misconfiguration risk (missing secrets, RLS prerequisites).

**Recommendation:** Add `.env.example` listing all required variables without values.

---

### SEC-015 — Demo role switcher in production UI

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Client |
| **Status** | Open |
| **Location** | `components/layout/sidebar.tsx:122-128` |

**Description:** "Demo Role" buttons invoke `switchRole()` changing client state without altering Supabase session.

**Impact:** UI confusion on production; does not bypass server authorisation.

**Recommendation:** Gate behind development mode or remove.

---

### SEC-016 — Client-only layout RBAC

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Client |
| **Status** | Open |
| **Location** | `app/(dashboard)/layout.tsx:27-29`, `app/client/layout.tsx` |

**Description:** Admin/client shell access determined by client-side `user.role` from auth context.

**Impact:** Routing/UX issue if SEC-001 active; data protected by API + RLS.

**Recommendation:** Resolve SEC-001; optional server-side middleware guards.

---

### SEC-017 — Minimal upload filename sanitization

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Category** | Validation |
| **Status** | Open |
| **Location** | `lib/supabase/documents.ts:66-68`, `personas.ts:70-72` |

**Description:** Filename sanitization replaces path separators and leading dots only. No extension allowlist or size check at application layer.

**Impact:** Limited path traversal risk due to storage RLS; MIME spoofing possible.

**Recommendation:** Allowlist extensions (pdf, csv, xlsx); enforce max size; strip null bytes.

---

### SEC-018 — No explicit CSRF protection

| Field | Value |
|-------|-------|
| **Severity** | Informational |
| **Category** | Validation |
| **Status** | Open |
| **Location** | Cookie-authenticated POST API routes |

**Description:** State-changing requests rely on Supabase session cookies without CSRF tokens.

**Impact:** Mitigated by SameSite cookie defaults on modern browsers.

**Recommendation:** Document accepted risk; verify Supabase cookie SameSite configuration.

---

### SEC-019 — Vulnerable Next.js version

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Dependency |
| **Status** | Open |
| **Location** | `package.json` — `next@16.1.6` |

**Description:** `pnpm audit` (10 Jun 2026) reports multiple HIGH advisories for Next.js 16.0.0–16.2.4 including DoS and cache poisoning. Patched in ≥16.2.5.

**Advisories (sample):** GHSA-q4gf-8mx6-v5v3, GHSA-3g8h-86w9-wvmq, GHSA-vfv6-92ff-j949

**Impact:** Production availability and cache integrity risk.

**Recommendation:** Upgrade to `next@>=16.2.5`.

---

### SEC-020 — Vulnerable Vitest version (dev)

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Category** | Dependency |
| **Status** | Open |
| **Location** | `package.json` — `vitest@3.0.5` |

**Description:** GHSA-5xrq-8626 — arbitrary file read and execute when Vitest UI server is listening.

**Impact:** Development/CI environment only; no production runtime unless Vitest UI exposed publicly.

**Recommendation:** Upgrade to `vitest@>=3.2.6`.

---

### SEC-021 — Lodash via recharts

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Dependency |
| **Status** | Open |
| **Location** | `recharts>lodash` (transitive) |

**Description:** GHSA-r5fr-rjxr-66jc — code injection via `_.template` import key names. Affected lodash ≤4.17.23.

**Impact:** Low practical risk if `_.template` not invoked in application code paths.

**Recommendation:** Upgrade recharts or pnpm override lodash to ≥4.18.0.

---

### SEC-022 — Picomatch ReDoS (transitive)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Dependency |
| **Status** | Open |
| **Location** | `tailwindcss>chokidar>picomatch`, `tailwindcss>sucrase>tinyglobby>picomatch` |

**Description:** GHSA-c2c7-rcm5-vvqj — ReDoS via extglob quantifiers.

**Impact:** Primarily build/dev tooling; not production runtime.

**Recommendation:** Update tailwindcss dependency tree or lockfile overrides for picomatch ≥2.3.2 / ≥4.0.4.

---

## Positive Controls Verified

The following controls were verified during the audit and require no remediation:

1. **Admin API gate** — All `/api/admin/*` routes call `requireDashboardAdmin` before service-role client use.
2. **Chat API gate** — All `/api/chat/*`, `/api/n8n`, focus-group, audience, and credits routes call `requireChatSession`.
3. **Chat ownership** — `chat/poll` and `chat/result` verify row `user_id` matches authenticated profile.
4. **Project scoping** — `chat/persist` loads project via user-scoped Supabase client (RLS-enforced).
5. **Demo tokens** — HMAC-SHA256 with `timingSafeEqual` on approve/reject links.
6. **n8n callback validation** — Zod schema plus org/project/user cross-validation before upsert.
7. **Demo signup** — Rate limit (3 requests/hour/email) and generic success responses (anti-enumeration).
8. **RLS foundation** — `is_dashboard_admin()`, `auth_user_can_read_project()`, storage SECURITY DEFINER helpers.
9. **Profile self-read** — `users_select_self_or_admin` policy supports secure auth bootstrap.

---

## API Route Auth Coverage

Full route matrix: [`../audit/task-03-api-routes.md`](../audit/task-03-api-routes.md).

| Tier | Routes | Auth |
|------|--------|------|
| Admin | `/api/admin/**` | `requireDashboardAdmin` |
| Cron | `/api/cron/**` | Bearer `CRON_SECRET` |
| Chat/user | `/api/chat/**`, `/api/n8n`, focus-group, audience, credits | `requireChatSession` |
| n8n callback | `/api/chat/n8n-complete` | Shared secret |
| Demo public | `/api/demo/request` | None (rate limited) |
| Demo email | `/api/demo/approve`, `/api/demo/reject` | HMAC token |
| Demo session | `/api/demo/session`, `record-first-login`, `complete-password-setup` | Session cookie |

---

## Dependency Scan Results

**Command:** `pnpm audit`  
**Date:** 10 June 2026  
**Totals:** 29 vulnerabilities (1 critical, 11 high, 14 moderate, 3 low)

Production-priority upgrades: **Next.js**, then transitive **lodash** and **picomatch**. Dev-only: **Vitest**.

---

## Remediation Tracking (final)

| ID | Target phase | Status |
|----|--------------|--------|
| SEC-001 | Phase 1 | Fixed |
| SEC-002 | Phase 1 | Fixed |
| SEC-003 | Phase 2 | Fixed |
| SEC-004 | Phase 2 | Fixed |
| SEC-005 | Phase 2 | Fixed |
| SEC-006 | Phase 3 | Fixed |
| SEC-007 | Phase 1 | Fixed |
| SEC-008 | Phase 1 | Accepted risk |
| SEC-009 | Phase 3 | Accepted risk |
| SEC-010 | Phase 2 | Fixed |
| SEC-011 | Phase 2 | Fixed |
| SEC-012 | Phase 1 | Fixed |
| SEC-013 | Phase 2 | Fixed |
| SEC-014 | Phase 2 | Fixed |
| SEC-015 | Phase 2 | Fixed |
| SEC-016 | Phase 2 | Fixed |
| SEC-017 | Phase 3 | Fixed |
| SEC-018 | Phase 3 | Accepted risk |
| SEC-019 | Phase 1 | Fixed |
| SEC-020 | Phase 3 | Fixed |
| SEC-021 | Phase 3 | Fixed |
| SEC-022 | Phase 3 | Fixed |

---

## Sign-Off

| Field | Value |
|-------|-------|
| Audit programme | Complete (Tasks 1–9) |
| Migration applied | `202606101300_security_audit_rls_hardening.sql` |
| Automated verification | 49 tests pass; `pnpm audit` clean; build success |
| Verification log | [`../audit/task-09-verification.md`](../audit/task-09-verification.md) |

---

*End of Technical Appendix v2.0 (signed off)*
