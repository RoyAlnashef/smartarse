# Demo Signup v2 — smoke test checklist

Supersedes the v1 paths in [`../2026-05-19-1200-demo-access-flow/smoke-test-checklist.md`](../2026-05-19-1200-demo-access-flow/smoke-test-checklist.md) for signup layout, fields, password activation, and consent.

## Prerequisites

- [ ] Migrations applied: `202605191200_demo_access_requests.sql`, `202605201200_demo_project_flag.sql`, `202606041200_demo_access_requests_signup_fields.sql`
- [ ] Env set: `DEMO_APPROVAL_SECRET`, `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM_ADDRESS`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Admin has set **Use as demo project** on one project (Settings tab)
- [ ] Supabase Auth redirect URLs include `/auth/demo-setup` and `/auth/callback` for local and production
- [ ] Optional: `NEXT_PUBLIC_DEMO_COOKIE_POLICY_URL` for cookie policy link in consent UI

## Public signup (`/demo`)

### Layout

- [ ] Desktop: 50/50 split — marketing left (Disrupt top, smart A.R.S.E. + copy + features bottom), form right with pink border card
- [ ] Mobile: marketing column hidden; smart A.R.S.E. logo above form; form fits viewport without excessive scroll

### Form and API

- [ ] Submit with all four fields + **required privacy consent** → generic success (“We'll be in touch if approved.”)
- [ ] Submit without privacy consent → button disabled (cannot submit)
- [ ] Optional marketing checkbox — when checked, `metadata.consents.marketing` stored; when unchecked, omitted
- [ ] `demo_access_requests` row has `first_name`, `last_name`, `organization_name` columns populated
- [ ] `metadata.consents.privacy` has `acceptedAt` + version `privacy-demo-2026-06-04` (or current version in `lib/demo-access/consent.ts`)
- [ ] Re-submit same email while pending → generic success; pending row updated (name/org + latest consent metadata)
- [ ] Invalid/missing consent in API body → generic success, no new row (anti-enumeration)
- [ ] Rate limit (>3/hour per email) → still generic success

### Cookie banner (demo flow only)

- [ ] First visit `/demo` shows cookie banner (essential vs optional copy)
- [ ] **Essential only** → choice stored in `localStorage`; banner hidden on reload
- [ ] **Accept optional** → `nonEssential: true` stored; `window.__SMARTARSE_DEMO_NON_ESSENTIAL_CONSENT__` set (no optional scripts on page today)
- [ ] Banner also appears on `/auth/demo-setup` until choice recorded
- [ ] After cookie choice, signup stores `metadata.cookiePreferences` when user submits (if banner was answered)

### Support notification

- [ ] Notification delivered to dashboard **Support email** (Settings; same resolver as credit/access alerts), unless `DEMO_NOTIFICATION_EMAIL` is set for local testing
- [ ] Notification email includes name, email, organization
- [ ] Approve / Reject links work

## Approval and password activation

- [ ] Approve provisions user with `app_metadata.requires_password_setup: true` and `demo_user: true`
- [ ] Prospect email CTA: “Set up your password” → link lands on `/auth/demo-setup` (not `/auth/callback`)
- [ ] Create password (min 8 chars, confirm match) → `POST /api/demo/complete-password-setup` clears flag → redirect to demo project
- [ ] `first_login_at` and `provisioned_project_id` set on `demo_access_requests`
- [ ] Old magic link to `/auth/callback` with `requires_password_setup` → redirects to `/auth/demo-setup`
- [ ] Post-setup: sign in with email + password on `/`

## Reject / expired (unchanged behavior)

- [ ] Reject link marks rejected and emails prospect
- [ ] Expired or invalid approve/reject token shows friendly error
- [ ] Cron `GET /api/cron/expire-demo-requests` with `Authorization: Bearer $CRON_SECRET` marks old pending as `expired`

## Admin dashboard (`/demo-requests`)

- [ ] Table columns: **Name**, **Organization**, Email, Status, Link sent, First login
- [ ] Consent **not** shown in admin UI (verify in DB `metadata` only)
- [ ] Inline Approve / Reject match email-link behavior

## Demo user UX (post-login)

- [ ] Visiting `/client/projects` as demo user redirects to demo project
- [ ] Breadcrumb “← Projects” hidden; header logo links to demo project only

## Legal / copy go-live (before production)

- [ ] Replace placeholder strings in `lib/demo-access/consent.ts` with legal-approved copy and version IDs (`client-legal-briefing.md` §9)
- [ ] Set `NEXT_PUBLIC_DEMO_COOKIE_POLICY_URL` if cookie policy is not `/help/privacy`
