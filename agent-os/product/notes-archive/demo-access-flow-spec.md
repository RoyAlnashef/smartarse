# Feature Spec: Demo Access Flow — Magic-Link Approval System

**Project:** Disrupt AI Research Platform  
**Feature:** Controlled demo access with manual approval and magic-link provisioning  
**Author:** Roy Alnashef  
**Status:** Draft v1.0  
**Stack:** Next.js (App Router), Supabase, Resend / SendGrid, TypeScript, Tailwind CSS, Shadcn UI

---

## Overview

Visitors to the Disrupt marketing site can request demo access to the platform. Disrupt staff receive a notification email and approve or reject the request via a signed link — no login required. Approved users receive a Supabase magic link that drops them directly into a shared demo organisation. The system includes an admin dashboard, automated stale-request cleanup, and full lifecycle tracking.

---

## Goals

- Let Disrupt control who gets demo access without a manual provisioning workflow.
- Minimise friction for both the requester (one field, one click) and the approver (inline email actions, no portal login needed).
- Keep the demo org isolated from production orgs via existing Supabase RLS.
- Produce an auditable request log visible from the admin dashboard.

---

## Non-Goals

- Self-serve signup (no open registration).
- Second-factor confirmation for Disrupt approvers.
- Designed HTML template for rejection emails (plain-text only for v1).
- Multi-step onboarding after magic link login.

---

## Actors

| Actor             | Description                                                         |
| ----------------- | ------------------------------------------------------------------- |
| **Visitor**       | Unauthenticated website visitor requesting demo access              |
| **Disrupt Staff** | Internal approver who receives and acts on request notifications    |
| **Demo User**     | Approved visitor with scoped access to the shared demo organisation |
| **Admin**         | Authenticated Disrupt admin managing requests from the dashboard    |

---

## User Stories

### Visitor — Requesting Access

**US-01 — Submit a demo request**

> As a visitor, I want to submit my email address to request demo access, so that I can try the platform without self-registering.

Acceptance criteria:

- Public route (e.g. `/demo`) is accessible without authentication.
- Form accepts a single email field with client-side and server-side validation.
- Submission succeeds silently even if the email already has a pending request (no enumeration).
- Success state shows a neutral message: "We'll be in touch if approved."
- Duplicate submissions within the TTL window are idempotent (no duplicate rows, no error shown to user).

---

**US-02 — Receive confirmation that the request was received**

> As a visitor, I want to see a clear confirmation after submitting, so that I know my request is in progress.

Acceptance criteria:

- After submit, the form is replaced with a success message.
- No email is sent to the requester at this stage (notification only goes to Disrupt).
- The success message does not reveal whether an account exists.

---

### Disrupt Staff — Reviewing Requests

**US-03 — Receive a notification when a new demo request arrives**

> As a Disrupt staff member, I want to receive an email when someone requests demo access, so that I can review and act on it promptly.

Acceptance criteria:

- Notification email is sent immediately on form submission.
- Email includes: requester email, timestamp, and two clearly labelled action buttons (Approve / Reject).
- Action URLs are HMAC-signed and time-limited (configurable TTL, default 72 hours).
- Clicking Approve or Reject does not require the staff member to log in to the platform.

---

**US-04 — Approve a demo request via email**

> As a Disrupt staff member, I want to approve a request directly from my email, so that I don't have to log in to a separate system.

Acceptance criteria:

- Clicking Approve validates the HMAC token and its expiry.
- On success: creates a Supabase auth user (role: `admin_provisioned`), upserts `public.users` into the shared demo org, generates a Supabase magic link, and sends it to the requester.
- Request status updates to `approved` → `magic_link_sent`.
- Expired or already-used tokens return a clear error page (not a 500).
- Approving a request that has already been approved is a no-op with a friendly message.

---

**US-05 — Reject a demo request via email**

> As a Disrupt staff member, I want to reject a request directly from my email, so that I can close the loop without manual steps.

Acceptance criteria:

- Clicking Reject validates the HMAC token.
- Request status updates to `rejected`.
- A plain-text rejection email is sent to the requester.
- Rejection is idempotent — rejecting an already-rejected request is a no-op.

---

### Demo User — Accessing the Platform

**US-06 — Receive a magic link after approval**

> As an approved visitor, I want to receive a magic link by email, so that I can access the platform immediately without setting a password.

Acceptance criteria:

- Magic link email is sent within seconds of approval.
- Email is branded (HTML template, responsive, inline styles).
- Link leads directly into the platform (demo org context).
- Link expiry follows Supabase default (1 hour), after which the user can request a new one via standard auth flow.

---

**US-07 — First login is tracked**

> As Disrupt, I want to know when a demo user first logs in, so that I can measure activation rate.

Acceptance criteria:

- `first_login_at` is set on the `public.users` row on the user's first authenticated session.
- Logic is guarded: `first_login_at` is only written when currently `null`.
- Implemented via post-auth redirect handler (not a trigger).

---

### Admin — Managing Requests

**US-08 — View all demo requests in the dashboard**

> As an admin, I want to see all demo requests in a table, so that I can monitor the pipeline and take action if needed.

Acceptance criteria:

- Admin-only page under the existing protected shell (uses `requireDashboardAdmin` guard).
- Table columns: email, status, requested at, approved/rejected at, magic link sent at, first login at.
- Filterable by status (`pending`, `approved`, `rejected`, `magic_link_sent`).
- Sortable by date (default: newest first).
- Empty state shown when no requests exist.

---

**US-09 — Approve or reject requests from the dashboard**

> As an admin, I want to approve or reject requests inline from the dashboard, so that I have a management surface independent of my email client.

Acceptance criteria:

- Approve and Reject actions are available per row (matching the email link flow).
- Actions call the same API routes as the email links (no duplicate logic).
- Row status updates optimistically on action, with error rollback.
- Confirmation prompt before rejection (destructive action).

---

**US-10 — Stale requests are cleaned up automatically**

> As Disrupt, I want old pending requests to expire automatically, so that the dashboard doesn't accumulate noise and users aren't left in limbo.

Acceptance criteria:

- Pending requests expire after a configurable TTL (env var, default: 7 days).
- Expired requests are either deleted or marked `expired` (configurable).
- Cleanup runs on a schedule (cron job or DB function).
- Optional: Disrupt receives a digest notification for requests about to expire.
- Duplicate email submissions within TTL are handled idempotently (no new row created).

---

## Data Model

### `demo_access_requests`

| Column                      | Type          | Notes                                                               |
| --------------------------- | ------------- | ------------------------------------------------------------------- |
| `id`                        | `uuid`        | Primary key                                                         |
| `email`                     | `text`        | Requester email                                                     |
| `status`                    | `enum`        | `pending` / `approved` / `rejected` / `magic_link_sent` / `expired` |
| `requested_at`              | `timestamptz` | Set on insert                                                       |
| `approved_at`               | `timestamptz` | Nullable                                                            |
| `rejected_at`               | `timestamptz` | Nullable                                                            |
| `magic_link_sent_at`        | `timestamptz` | Nullable                                                            |
| `approval_token`            | `text`        | HMAC-signed, hashed for storage                                     |
| `approval_token_expires_at` | `timestamptz` | Based on TTL from config                                            |
| `user_id`                   | `uuid`        | FK to `auth.users` — set after provisioning                         |
| `first_login_at`            | `timestamptz` | Set via post-auth handler                                           |
| `metadata`                  | `jsonb`       | IP, user-agent, source (for future use)                             |

**Indexes:** `email`, `status`, `requested_at`

**RLS policies:**

- Inserts via API only (no direct client access).
- Admin-only read/update.

---

## API Routes

| Route                                   | Method | Auth                          | Purpose                                          |
| --------------------------------------- | ------ | ----------------------------- | ------------------------------------------------ |
| `/demo`                                 | `GET`  | None                          | Public demo request page                         |
| `/api/demo/request`                     | `POST` | None (rate-limited)           | Submit demo request                              |
| `/api/demo/approve`                     | `GET`  | HMAC token                    | Approve request, provision user, send magic link |
| `/api/demo/reject`                      | `GET`  | HMAC token                    | Reject request, send rejection email             |
| `/api/admin/demo-requests`              | `GET`  | Supabase session + admin role | Paginated request list with filters              |
| `/api/admin/demo-requests/[id]/approve` | `POST` | Supabase session + admin role | Inline dashboard approval                        |
| `/api/admin/demo-requests/[id]/reject`  | `POST` | Supabase session + admin role | Inline dashboard rejection                       |

---

## Email Templates

### 1. Disrupt Notification

- **To:** Configured notification recipients (env var)
- **Subject:** `New demo request from {email}`
- **Content:** Requester email, timestamp, Approve button, Reject button
- **Format:** Responsive HTML, inline styles, branded

### 2. Requester Magic Link

- **To:** Requester email
- **Subject:** `Your Disrupt demo access`
- **Content:** Branded welcome, magic link CTA, link expiry note
- **Format:** Responsive HTML, inline styles, branded

### 3. Rejection Notice

- **To:** Requester email
- **Subject:** `Your demo request`
- **Content:** Plain-text, polite decline
- **Format:** Plain text (v1)

---

## Token Security

- Approval token is HMAC-signed using a server-side secret (`DEMO_APPROVAL_SECRET`).
- Token encodes: `request_id`, `action` (`approve` | `reject`), `expires_at`.
- Server validates signature and expiry on every use.
- Token is single-use: status transition to `approved` or `rejected` makes subsequent uses no-ops.
- Token is **not** stored in plaintext — store a hash if storage is needed for audit.

---

## Environment Variables

| Variable                       | Purpose                                         |
| ------------------------------ | ----------------------------------------------- |
| `DEMO_ORGANIZATION_ID`         | Supabase UUID of the shared demo org            |
| `DEMO_APPROVAL_SECRET`         | HMAC signing secret for approval tokens         |
| `DEMO_NOTIFICATION_RECIPIENTS` | Comma-separated emails for Disrupt notification |
| `DEMO_REQUEST_TTL_DAYS`        | Stale request expiry window (default: 7)        |
| `EMAIL_PROVIDER_API_KEY`       | Resend / SendGrid API key                       |
| `EMAIL_FROM_ADDRESS`           | Sender address for all transactional email      |
| `NEXT_PUBLIC_APP_URL`          | Base URL for magic link redirect config         |

---

## Page Structure

### `/demo` — Public Request Page

- Matches existing login page layout and brand tokens.
- Single form field: email address.
- Submit button with loading state.
- Success state replaces form (no redirect).
- Rate-limited at the API layer (e.g. 3 requests per email per hour).
- No error message for duplicate emails (generic "We'll be in touch" for all outcomes).

### `/admin/demo-requests` — Admin Dashboard Page

- Protected by `requireDashboardAdmin`.
- Filter bar: status tabs or dropdown.
- Sortable table (columns per data model above).
- Inline Approve / Reject actions with confirmation on Reject.
- Pagination if request volume grows.
- Empty and loading states.

---

## Lifecycle State Machine

```
[Visitor submits email]
        ↓
    pending
        ↓ (Disrupt approves via email or dashboard)
    approved
        ↓ (magic link generated and sent)
  magic_link_sent
        ↓ (user clicks link and logs in)
  first_login_at set

OR:
    pending → rejected   (via email or dashboard)
    pending → expired    (automated TTL cleanup)
```

---

## Dependencies & Assumptions

- Existing `requireDashboardAdmin` guard and admin shell are stable and reusable.
- Existing login-page component is available for visual reference.
- DNS access is available for SPF/DKIM configuration.
- Supabase Auth redirect URLs updated to include the demo callback path.
- Shared demo organisation exists or will be seeded via migration.
- Supabase Admin API is accessible from server-side routes (service role key in env).

---

## Out of Scope (v1)

- Designed rejection email template (plain-text only).
- Second-factor confirmation for approvers.
- Demo org content seeding (separate concern).
- Analytics or conversion tracking on the request page.
- Self-expiring magic links beyond Supabase default behaviour.

---

## Open Questions

1. Should rejected requests be permanently rejected or allow re-submission after a cooldown?
2. What is the desired magic link expiry — Supabase default (1 hour) or custom?
3. Should the admin dashboard be a new top-level nav item or nested under Settings?
4. Who are the default `DEMO_NOTIFICATION_RECIPIENTS` — is this a single shared inbox or multiple individuals?
5. Should `expired` requests be soft-deleted or retained for reporting?
