# References for Demo Signup v2

## Client legal briefing (Task 2 — parallel)

- **Location:** `agent-os/specs/2026-06-03-1200-demo-signup-v2/client-legal-briefing.md`
- **Purpose:** Factual product/data inventory + UK GDPR transparency checklist for Disrupt’s legal team (not legal advice)
- **Feeds:** Task 6 consent checkbox copy, cookie banner text, version IDs, processor list, retention decisions
- **Plan:** `.cursor/plans/uk_gdpr_legal_briefing_4b727b4e.plan.md`

## Demo page (Task 3)

- **Location:** `app/demo/page.tsx`, `components/demo-request-page.tsx`
- **Reuse:** Refactor to split layout; keep footer links and `LoginFlowBackground`
- **Key patterns:** Centered single-email form today → 50/50 marketing + form card

## Login styling (Tasks 3, 5)

- **Location:** `components/login-page.tsx`, `components/login-flow-background.tsx`
- **Reuse:** Form controls, footer links, login-styled shell for `/auth/demo-setup`
- **Key patterns:** `LoginFlowBackground`, rounded pill inputs, `arse-*` tokens

## Password UX (Task 5)

- **Location:** `components/settings/change-password-form.tsx`, `app/auth/reset-password/page.tsx`
- **Reuse:** Validation patterns; new login-styled create-password variant
- **Key patterns:** Password + confirm fields, `supabase.auth.updateUser({ password })`

## Session from link (Task 5)

- **Location:** `lib/supabase/session-from-url.ts`
- **Reuse:** Activation page token handling for `/auth/demo-setup`
- **Key patterns:** `establishSessionFromUrl` before showing password form

## Demo backend (Tasks 4, 5, 6)

- **Location:** `lib/demo-access/request-service.ts`, `lib/demo-access/provision.ts`, `lib/demo-access/email.ts`, `lib/demo-access/types.ts`
- **Reuse:** Extend request schema, provision redirect + `app_metadata`, email copy
- **Key patterns:** `createDemoAccessRequest`, `ensureDemoUser`, `generateLink`, `sendDemoMagicLinkEmail`

## Demo request API (Task 4)

- **Location:** `app/api/demo/request/route.ts`
- **Reuse:** Zod validation + rate limiting; add four fields + consent payload in metadata

## Schema (Task 4)

- **Location:** `supabase/migrations/202605191200_demo_access_requests.sql`
- **Reuse:** Add columns or extend migration; `metadata` jsonb for GDPR consents

## First login (Task 5)

- **Location:** `app/api/demo/record-first-login/route.ts`, `app/auth/callback/page.tsx`
- **Reuse:** Post-password redirect to demo project; callback guard for `requires_password_setup`

## Admin queue (Tasks 4, 7)

- **Location:** `app/(dashboard)/demo-requests/page.tsx`, `components/dashboard/demo-requests-table.tsx`
- **Reuse:** New name and organization columns; no consent columns in UI

## Privacy / consent targets (Task 6)

- **Legal briefing:** `client-legal-briefing.md` — full app data map; demo copy slots in briefing § Demo signup v2

- **Location:** `app/help/privacy/page.tsx`
- **Reuse:** Checkbox link targets; client may supply separate cookie policy URL

## Prior demo access spec

- **Location:** `agent-os/specs/2026-05-19-1200-demo-access-flow/`
- **Relevance:** Baseline magic-link flow; v2 supersedes passwordless-only entry (Task 4)

## Smoke checklist pattern (Task 7)

- **Location:** `agent-os/specs/2026-06-02-1200-disrupt-support-email-notifications/smoke-test-checklist.md`
- **Relevance:** Template for demo v2 end-to-end QA checklist

## Product archive

- **Location:** `agent-os/product/notes-archive/demo-access-flow-spec.md`
- **Relevance:** Add v2 supersession note when implementing
