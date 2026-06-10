# References for Full Application Security Audit

Security-relevant file inventory for the audit. Paths are relative to the repository root.

---

## Authentication and Session

| File | Relevance |
|------|-----------|
| `middleware.ts` | Supabase cookie refresh on all non-static routes; no auth enforcement |
| `lib/supabase/client.ts` | Browser Supabase client (`@supabase/ssr`) |
| `lib/supabase/server.ts` | Server Route Handler client (cookie read/write) |
| `lib/supabase/admin.ts` | Service-role client — bypasses RLS |
| `lib/supabase/config.ts` | Anon URL/key from `NEXT_PUBLIC_*` env |
| `lib/auth-context.tsx` | Client auth state, profile hydration, mock/JWT fallbacks |
| `lib/supabase/fetch-user-profile.ts` | Reads `public.users` under RLS |
| `lib/supabase/session-from-url.ts` | Magic-link session from URL hash |
| `components/app-providers.tsx` | Wraps app in `AuthProvider` |
| `components/login-page.tsx` | Login UI and role-based redirect |
| `app/page.tsx` | Root login entry |
| `app/auth/callback/page.tsx` | Auth callback handler |
| `app/auth/reset-password/page.tsx` | Password reset flow |
| `app/auth/demo-setup/page.tsx` | Demo password setup after approval |

---

## Authorization Helpers

| File | Relevance |
|------|-----------|
| `lib/api/require-dashboard-admin.ts` | Admin session/Bearer check → service-role client |
| `lib/api/require-chat-session.ts` | Active user with org → user-scoped client |
| `lib/api/authorize-cron-request.ts` | Bearer `CRON_SECRET` validation |
| `lib/api/authorize-cron-request.test.ts` | Unit tests for cron auth |

---

## Page-Level Guards (Client-Side)

| File | Relevance |
|------|-----------|
| `app/(dashboard)/layout.tsx` | Admin dashboard shell gate |
| `app/client/layout.tsx` | Client/user shell gate |
| `app/(dashboard)/users/page.tsx` | Admin-only page |
| `app/(dashboard)/analytics/page.tsx` | Admin-only page |
| `app/(dashboard)/settings/support-notifications/page.tsx` | Admin-only page |
| `components/layout/sidebar.tsx` | Nav filtering; demo role switcher |

---

## API Routes — Admin (High Risk)

| Route | File |
|-------|------|
| Users list/create | `app/api/admin/users/route.ts` |
| User delete | `app/api/admin/users/[id]/route.ts` |
| Demo requests list | `app/api/admin/demo-requests/route.ts` |
| Demo approve | `app/api/admin/demo-requests/[id]/approve/route.ts` |
| Demo reject | `app/api/admin/demo-requests/[id]/reject/route.ts` |
| Demo project flag | `app/api/admin/demo-project/route.ts` |
| Platform settings | `app/api/admin/platform-settings/route.ts` |
| Project chat history | `app/api/admin/projects/[id]/chat-history/route.ts` |
| Project chat result | `app/api/admin/projects/[id]/chat-result/route.ts` |
| Focus group session | `app/api/admin/projects/[id]/focus-group-session/route.ts` |
| Credit alert eval | `app/api/admin/projects/[id]/evaluate-credit-alert/route.ts` |

---

## API Routes — Cron (High Risk)

| Route | File | Auth pattern |
|-------|------|--------------|
| Pause expired projects | `app/api/cron/pause-expired-projects/route.ts` | Inline Bearer check |
| Expire demo requests | `app/api/cron/expire-demo-requests/route.ts` | Inline Bearer check |
| Support notifications | `app/api/cron/support-notifications/route.ts` | `authorizeCronRequest` |
| Support outbox | `app/api/cron/support-notifications-outbox/route.ts` | `authorizeCronRequest` |
| Schedule config | `vercel.json` | Vercel Cron definitions |

---

## API Routes — Chat and User (Medium Risk)

| Route | File |
|-------|------|
| n8n proxy | `app/api/n8n/route.ts` |
| Chat persist | `app/api/chat/persist/route.ts` |
| Chat poll | `app/api/chat/poll/route.ts` |
| Chat result | `app/api/chat/result/route.ts` |
| Chat history | `app/api/chat/history/route.ts` |
| Chat cancel | `app/api/chat/cancel/route.ts` |
| Promote draft thread | `app/api/chat/promote-draft-custom-audience-thread/route.ts` |
| n8n callback | `app/api/chat/n8n-complete/route.ts` |
| Focus group sessions | `app/api/focus-group/sessions/route.ts` |
| Focus group session | `app/api/focus-group/sessions/[id]/route.ts` |
| End focus group | `app/api/focus-group/sessions/[id]/end/route.ts` |
| Saved audiences | `app/api/audience/saved/route.ts` |
| Saved audience by id | `app/api/audience/saved/[id]/route.ts` |
| Focus group credit charge | `app/api/credits/charge-focus-group-round/route.ts` |

---

## API Routes — Demo and Public (Lower Risk)

| Route | File |
|-------|------|
| Demo request submit | `app/api/demo/request/route.ts` |
| Email approve | `app/api/demo/approve/route.ts` |
| Email reject | `app/api/demo/reject/route.ts` |
| Demo session probe | `app/api/demo/session/route.ts` |
| Password setup complete | `app/api/demo/complete-password-setup/route.ts` |
| First login record | `app/api/demo/record-first-login/route.ts` |

---

## Demo Access Library

| File | Relevance |
|------|-----------|
| `lib/demo-access/config.ts` | Env config, TTLs, secrets |
| `lib/demo-access/tokens.ts` | HMAC approve/reject tokens |
| `lib/demo-access/tokens.test.ts` | Token unit tests |
| `lib/demo-access/config.test.ts` | Config unit tests |
| `lib/demo-access/request-service.ts` | Rate limiting, request creation |
| `lib/demo-access/provision.ts` | User provisioning on approval |
| `lib/demo-access/reject.ts` | Rejection flow |
| `lib/demo-access/session.ts` | Demo session helpers |
| `lib/demo-access/email.ts` | Approval/rejection emails |
| `lib/demo-access/consent.ts` | GDPR consent validation |

---

## Supabase Client Data Layer (RLS-Dependent)

| File | Relevance |
|------|-----------|
| `lib/supabase/projects.ts` | Project CRUD from browser |
| `lib/supabase/users.ts` | User management from browser |
| `lib/supabase/organizations.ts` | Org CRUD from browser |
| `lib/supabase/documents.ts` | Document upload + storage |
| `lib/supabase/personas.ts` | Persona upload + storage |
| `lib/supabase/dashboard-stats.ts` | Dashboard aggregates |

---

## Third-Party Integrations

| File | Relevance |
|------|-----------|
| `lib/n8n-webhook-url.ts` | Webhook URL resolution; `NEXT_PUBLIC_*` fallback |
| `lib/email/send-transactional.ts` | Resend email sender |
| `lib/support-notifications/send.ts` | Support notification emails |
| `lib/support-notifications/process.ts` | Notification processing |
| `lib/support-notification-email.ts` | Recipient resolution |

---

## Key Supabase Migrations (RLS)

| Migration | Relevance |
|-----------|-----------|
| `202603232355_admin_rls_users_organizations.sql` | `is_dashboard_admin()` foundation |
| `202603261500_is_dashboard_admin_role_normalize.sql` | Case-insensitive admin role |
| `202603241800_projects_project_users.sql` | Project assignment schema |
| `202603241900_projects_project_users_rls.sql` | Project user RLS |
| `202603251200_fix_projects_rls_recursion.sql` | `auth_user_can_read_project()` |
| `202603261200_project_documents_storage.sql` | Document storage bucket |
| `202603261400_fix_project_documents_storage_rls.sql` | Storage RLS fixes |
| `202603261600_storage_project_docs_rls_helpers.sql` | Storage path helpers |
| `202603311200_chat_results.sql` | Chat results RLS (read org-scoped) |
| `202603311600_project_personas_storage.sql` | Persona storage RLS |
| `202605072335_custom_audience_persistence_and_chat_metadata.sql` | Custom audience RLS |
| `202605111400_project_custom_audiences_select_creator.sql` | Creator-scoped audience select |
| `202605130630_focus_groups.sql` | Focus group tables + RPCs |
| `202605191200_demo_access_requests.sql` | Demo request RLS |
| `202606021200_support_email_notifications.sql` | Support notification tables |
| `202604091200_projects_access_until.sql` | Access window + pause helpers |
| `202606101200_access_until_london_calendar.sql` | London calendar day semantics |
| `202603281000_auth_users_drop_all_custom_triggers_and_harden_skip.sql` | Auth trigger hardening |
| `202603271200_auth_user_skip_default_org_when_admin_provisioned.sql` | Admin-provisioned user org skip |

Full migration set: `supabase/migrations/` (48 files).

---

## Existing Security Tests

| File | Coverage |
|------|----------|
| `lib/api/authorize-cron-request.test.ts` | Cron Bearer auth |
| `lib/demo-access/tokens.test.ts` | HMAC demo tokens |
| `lib/demo-access/config.test.ts` | Email/env config |
| `lib/supabase/session-from-url.test.ts` | Magic-link session |

**Gaps:** No tests for `requireDashboardAdmin`, `requireChatSession`, RLS behavior, admin API auth, or n8n callback auth.

---

## Documentation and Prior Specs

| File | Relevance |
|------|-----------|
| `README.md` | Env vars, cron setup, RLS prerequisites |
| `agent-os/specs/2026-03-23-1200-auth-rbac-foundation/` | Auth/RBAC design (reference only) |
| `agent-os/specs/2026-03-23-2330-supabase-admin-rls-user-org/` | Admin RLS design (reference only) |
| `agent-os/specs/2026-05-19-1200-demo-access-flow/` | Demo access security decisions |
| `agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/README.md` | n8n secret leak incident note |

---

## Environment Variables (Code References)

### Public (browser bundle)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_DEMO_COOKIE_POLICY_URL`
- `NEXT_PUBLIC_N8N_URL` / `NEXT_PUBLIC_N8N_WEBHOOK_URL` (migration fallback only)

### Server-only

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`
- `CHAT_N8N_CALLBACK_SECRET` / `N8N_CHAT_CALLBACK_SECRET`
- `CRON_SECRET`
- `DEMO_APPROVAL_SECRET`
- `DEMO_APPROVAL_TOKEN_TTL_HOURS`, `DEMO_REQUEST_TTL_DAYS`
- `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_RESEND_SANDBOX`
- `DEMO_NOTIFICATION_EMAIL`
- `VERCEL_URL`, `NODE_ENV`

Documented in `README.md` (~lines 220–306).
