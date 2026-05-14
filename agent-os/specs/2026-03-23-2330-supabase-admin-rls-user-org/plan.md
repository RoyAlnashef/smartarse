# Supabase Admin RLS + User/Org Create — Plan

## Progress Board

- `✅ COMPLETE` Task 1 — Save spec documentation
- `✅ COMPLETE` Task 2 — Add/verify RLS policies in Supabase SQL
- `✅ COMPLETE` Task 3 — Build secure server-side user-create API
- `✅ COMPLETE` Task 4 — Wire Add User modal to real create flow
- `🟨 IN PROGRESS` Task 5 — Verify end-to-end and close gaps

## How We Work In Parallel

- **Owner: You** = actions that require Supabase dashboard access, secrets, or final product decisions.
- **Owner: Me** = code changes in this repo.
- **Status tags:** `✅ COMPLETE`, `🟨 IN PROGRESS`, `🟥 INCOMPLETE`, `⛔ BLOCKED`.

## Task 1 — Save Spec Documentation

- **Owner:** Me
- **Status:** `✅ COMPLETE`
- **What was done:**
  - Created this spec folder and all docs:
    - `agent-os/specs/2026-03-23-2330-supabase-admin-rls-user-org/plan.md`
    - `agent-os/specs/2026-03-23-2330-supabase-admin-rls-user-org/shape.md`
    - `agent-os/specs/2026-03-23-2330-supabase-admin-rls-user-org/standards.md`
    - `agent-os/specs/2026-03-23-2330-supabase-admin-rls-user-org/references.md`
    - `agent-os/specs/2026-03-23-2330-supabase-admin-rls-user-org/visuals/README.md`

## Task 2 — Add/Verify RLS Policies for `organizations` and `users`

- **Owner:** You + Me
- **Status:** `✅ COMPLETE`
- **Goal:** Admin users can create/edit organizations and manage user rows without RLS failures.
- **Me (repo work):**
  - `✅ COMPLETE` Added SQL migration:
    - `supabase/migrations/202603232355_admin_rls_users_organizations.sql`
  - `✅ COMPLETE` Included:
    - `public.is_dashboard_admin()` helper (security definer)
    - Admin-guarded policies for `organizations` create/update/select
    - `users` policies: self-or-admin select, admin update, admin insert
- **You (Supabase work):**
  - `✅ COMPLETE` Ran SQL in Supabase project and verified policies are present.
  - `✅ COMPLETE` Verified admin can create organizations from dashboard.
- **Definition of done:**
  - Creating org from `/organizations` no longer throws:
    - `new row violates row-level security policy for table "organizations"`

## Task 3 — Create Secure Admin API for User Creation

- **Owner:** Me
- **Status:** `✅ COMPLETE`
- **Goal:** Allow dashboard admin to create a user with temporary password safely on server.
- **Implemented:**
  - `✅ COMPLETE` Added server client utility:
    - `lib/supabase/server.ts`
  - `✅ COMPLETE` Added service-role admin client utility:
    - `lib/supabase/admin.ts`
  - `✅ COMPLETE` Added `POST /api/admin/users` route:
    - `app/api/admin/users/route.ts`
    - validates request body via `zod`
    - validates signed-in admin session from cookies
    - creates auth user with temporary password
    - upserts `public.users` profile row and rolls back auth user on profile failure
  - `✅ COMPLETE` Added dependency:
    - `@supabase/ssr`

## Task 4 — Wire Add User Modal + Users Page

- **Owner:** Me
- **Status:** `✅ COMPLETE`
- **Goal:** Replace informational-only Add User modal with a functional create flow.
- **Implemented:**
  - `✅ COMPLETE` Updated `components/users/user-form-modal.tsx`:
    - Added create-user form fields (name, email, temporary password, confirm password, role, organization)
    - Added client-side validation for password length and confirmation
    - Kept edit-user behavior and role/org assignment flow intact
  - `✅ COMPLETE` Updated `app/(dashboard)/users/page.tsx`:
    - Added create handler that calls `POST /api/admin/users`
    - Added success/error toasts for create flow
    - Refreshes user + org data after successful creation

## Task 5 — Verification and Handoff

- **Owner:** You + Me
- **Status:** `🟨 IN PROGRESS`
- **Me:**
  - `✅ COMPLETE` Checked IDE lints for all touched files (no issues reported)
  - `🟨 IN PROGRESS` `pnpm lint` script currently fails due Next CLI config mismatch (`next lint` resolving `/lint` path)
  - `✅ COMPLETE` Validated error handling/toast paths in create and edit user flows
- **You:**
  - Validate in your live Supabase environment with real credentials and RLS
  - Confirm expected behavior with admin and non-admin accounts

## User Tasks (What You Need To Do)

- `🟥 INCOMPLETE` Provide/confirm `SUPABASE_SERVICE_ROLE_KEY` in local env for admin user creation API.
- `✅ COMPLETE` Apply SQL policies in Supabase.
- `✅ COMPLETE` Confirm admin test account has `role='admin'` in `public.users` (implied by successful admin org create).
- `🟨 IN PROGRESS` Re-test:
  - Create organization from `/organizations`
  - Create user from `/users`

## Notes

- You asked for temporary password onboarding, so create-user flow will use that pattern first.
- Policy enforcement remains server-side (RLS + API checks), not only UI role checks.
