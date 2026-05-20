# Demo access flow — smoke test checklist

## Prerequisites

- [ ] Migrations applied (`202605191200_demo_access_requests.sql`, `202605201200_demo_project_flag.sql`)
- [ ] Env set: `DEMO_APPROVAL_SECRET`, `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM_ADDRESS`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Admin has set **Use as demo project** on one project (Settings tab)
- [ ] Supabase Auth redirect URLs include `/auth/callback` for local and production

## Public signup

- [ ] Open `/demo`, submit a valid email → success message (no enumeration)
- [ ] Notification inbox receives email with Approve / Reject buttons
- [ ] Re-submit same email while pending → same generic success, no duplicate row

## Email approve / reject

- [ ] Approve without demo project configured → clear error (HTML or dashboard)
- [ ] Approve link provisions user, assigns `project_users`, sends magic link
- [ ] Prospect opens magic link → `/auth/callback` → **`/client/projects/{demoProjectId}`** (not list)
- [ ] `first_login_at` and `provisioned_project_id` set on `demo_access_requests`
- [ ] Reject link marks request rejected and sends plain-text email to prospect
- [ ] Expired or invalid token shows friendly HTML error page

## Demo user UX

- [ ] Visiting `/client/projects` as demo user redirects to demo project
- [ ] Breadcrumb “← Projects” hidden; header logo links to demo project only
- [ ] Wrong project URL redirects to demo project

## Admin dashboard

- [ ] Admin sees **Demo requests** in sidebar
- [ ] Banner shown when no demo project configured
- [ ] Table lists requests; status filter works
- [ ] Inline Approve / Reject match email-link behavior

## Cron

- [ ] `GET /api/cron/expire-demo-requests` with `Authorization: Bearer $CRON_SECRET` marks old pending rows as `expired`
