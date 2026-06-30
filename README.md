# smartA.R.S.E.

**Agentic Research Search Engine** — an AI-powered market research platform by Disrupt Insight. Query your research data using natural language and explore insights through segment personas, custom audiences, and focus groups.

## Overview

smartA.R.S.E. is a full-stack web application that lets research teams and their clients interact with market research data through conversational AI. It supports multiple user roles, document-based queries, and a **persona system** — segment personas, custom audiences, and focus groups — that lets you explore survey-derived voices and run multi-participant sessions.

### Key Features

Status legend: ✅ built, 🟡 partial/in progress, ⚪ planned/not built yet

- ✅ **Multi-role access**: Admin and Client roles with role-based routing and permissions
- ✅ **Admin dashboard**: Project management (documents/personas upload per project), user management, organizations, demo requests, support alerts, analytics (mock), settings, FAQ
- ✅ **Client portal**: Branded client experience with project search, project detail, AI chat, and account settings (`/client/settings`)
- ✅ **Supabase auth + session**: Sign in/out and session hydration via Supabase Auth
- ✅ **Supabase organizations management**: Admin can create, update, and deactivate organizations from the dashboard
- ✅ **Admin user provisioning API**: Admin can create users with temporary passwords via secure server route; user removal via `DELETE /api/admin/users/[id]`
- ✅ **RLS-backed admin workflows**: Policies and constraints enforce role checks and org-safe data relationships
- ✅ **Forgot password flow**: Send reset email from sign-in, recover session from email link, set a new password on `/auth/reset-password`, then enter the app by role
- ✅ **Demo access flow**: Unified public entry at **`/`** (Request Demo + Login tabs); manual approve/reject via email links; Supabase magic-link provisioning into the admin-designated **demo project**; first-login password setup at **`/auth/demo-setup`**; direct entry to that project (no project list); admin **Demo requests** dashboard; stale-request cron. Legacy **`/demo`** redirects to `/`.
- ✅ **Project chat + n8n**: Client chat POSTs to **`POST /api/n8n`** (server proxy — n8n URL and secret stay server-only), then `POST /api/chat/persist` and polling via `GET /api/chat/poll` until `chat_results` completes. Long-running workflows can call `POST /api/chat/n8n-complete` when `CHAT_N8N_CALLBACK_SECRET` is set (see [`agent-os/specs/2026-03-26-1400-project-chat-n8n-integration/`](agent-os/specs/2026-03-26-1400-project-chat-n8n-integration/)). In-flight requests can be cancelled via `POST /api/chat/cancel`.
- ✅ **Client project workspace**: Main column holds chat, **Chat History** card (`ChatHistoryCard`), and source selection; right column uses **Personas | Studio** tabs (`ProjectSidebarTabs`, line-style). **Studio** is visible but placeholder-only. Mobile uses the same tabbed shell inside the overlay drawer.
- ✅ **Chat history (past questions)**: `GET /api/chat/history` backed by `chat_results`; client page uses `useChatHistory` and merges API rows with in-session items (falls back to mock data when Supabase is off or the list is empty). Rows reflect persona, custom-audience, and focus-group context.
- ✅ **Custom audiences**: Build, explore-before-save, and persist saved audiences per project via **`/api/audience/saved`**; apply to chat with segment-stack UI; draft threads can be promoted via `POST /api/chat/promote-draft-custom-audience-thread`.
- ✅ **Focus groups**: Multi-participant sessions via **`/api/focus-group/sessions`**; rounds charged up-front (`POST /api/credits/charge-focus-group-round` — 2 credits per participant per round); admin transcript view; session metadata in chat history.
- ✅ **Inline citations**: Assistant Markdown responses render numbered citation chips with source tooltips (survey, interview, document) via `lib/chat/inline-citations.ts`.
- ✅ **Support email notifications**: Admin **Support alerts** settings (`/settings/support-notifications`) with **Settings** and **Logs** tabs; per-project low-credit threshold; daily access-expiry reminders and outbox processing via cron; changing a project's **Access until** clears prior expiry log rows so reminders re-send for the new date (see Environment).
- 🟡 **Document-based queries**: Upload and selection UX exists; production document-grounded query backend is still evolving
- ✅ **Credit system**: Balance and management surfaces exist; per-turn chat charges and focus-group round charges (2 credits × participants); live projects auto-pause when remaining **credit_balance** hits zero (DB trigger); end-to-end consumption reporting is still evolving
- ✅ **Project access window**: Optional end date (`access_until`, inclusive London calendar day). Live projects auto-pause after that day via row triggers, `pause_project_if_access_expired` before chat persist/completion, and a scheduled job (`GET /api/cron/pause-expired-projects`, Vercel Cron in `vercel.json`) when `CRON_SECRET` is set

## Current Progress Snapshot

*Last updated: June 2026.*

- **Implemented in app + Supabase**:
  - Auth/session routing with admin/client role-aware redirects; unified login + demo request at `/`
  - Organizations dashboard wired to Supabase (create/update/soft delete via status); table shows **Projects**, **Users**, and **Chats** per organization
  - Users dashboard wired to Supabase for org assignment and admin-only user creation
  - Admin routes: users CRUD, demo requests approve/reject, demo project config, platform settings, support notification logs, project chat-history/result, focus-group session, credit-alert evaluation
  - Chat routes: `history`, `result`, `poll`, `persist`, `n8n-complete`, `cancel`, `promote-draft-custom-audience-thread`; n8n proxy at `POST /api/n8n`
  - Audience + focus group routes: `/api/audience/saved`, `/api/focus-group/sessions`, `/api/credits/charge-focus-group-round`
  - Demo routes: `POST /api/demo/request`, approve/reject (email + API), session, password setup, first-login recording
  - Cron jobs (Bearer `CRON_SECRET`): pause expired projects, expire demo requests, support notifications + outbox
  - Client hooks: `useChatHistory`, `useChatQuestion`, `useFocusGroupRound`, `useDemoSession`
  - Supabase migrations for admin RLS, credits/auto-pause, storage RLS, `chat_results`, `focus_groups`, custom audiences, demo access, support notifications, `access_until`
- **Recent progress**:
  - **Support alerts**: Delivery log on `/settings/support-notifications` (Logs tab, `GET /api/admin/support-notification-logs`); updating **Access until** resets expiry notification state via DB trigger
  - **Dashboard**: Project cards show user count, chat count, optional **Access until**, credits meter; nav includes **Demo requests**, **Support alerts**, **Organizations**
  - **Chat UI**: GFM Markdown + inline citation chips; focus-group and custom-audience context in history rows; admin focus-group transcript
  - **Client workspace**: Chat history card in main column; Personas | Studio right sidebar; custom audience builder and focus-group launcher in persona panel
  - **Demo flow**: Unified `/` entry with marketing panel; `/auth/demo-setup` password provisioning; cookie consent on demo path
  - **Legal/help**: Public `/help/faq`, `/help/privacy`, `/help/terms`, `/help/cookies` (contact via mailto in FAQ)
- **Still evolving**:
  - Chat UX: full spec alignment for history pagination, re-run-from-history, and edge cases per `agent-os/product/dev-notes/chat-history-spec.md`
  - **Studio** tab content (currently empty placeholder)
  - Full AI/RAG depth and richer credit analytics
  - Analytics page (`/analytics`) — mock data only; not yet wired to live Supabase metrics

### Product specs (agent-os)

Detailed feature plans, standards, and references live under [`agent-os/`](agent-os/) (e.g. chat history, n8n coordination, custom audiences, focus groups, demo access, support notifications). For end-to-end chat + n8n QA, see [`agent-os/specs/2026-03-26-1400-project-chat-n8n-integration/smoke-test-checklist.md`](agent-os/specs/2026-03-26-1400-project-chat-n8n-integration/smoke-test-checklist.md).

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack via `next dev --turbo`)
- **UI**: React 19, [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **Forms**: React Hook Form, Zod, `@hookform/resolvers`
- **Chat rendering**: `react-markdown` + `remark-gfm` for assistant message Markdown (lists, tables, GFM); inline citation chips in `lib/chat/`
- **Email**: [Resend](https://resend.com/) for demo access, support notifications, and transactional mail
- **Charts**: Recharts (analytics page — mock data today)
- **State**: React Context (auth), local component state
- **Auth & data**: [Supabase Auth](https://supabase.com/docs/guides/auth), Supabase client + RLS-backed tables
- **Testing**: [Vitest](https://vitest.dev/) (`pnpm test`)
- **Package manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 20.9+ (required by Next.js 16)
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/RoyAlnashef/smartarse.git
cd smartarse

# Install dependencies
pnpm install

# Configure environment variables (see Environment section below)
# then start the development server

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Public entry (login + demo request)

When signed out, **`/`** shows the unified entry page with two tabs:

- **Request Demo** — prospect signup form (`POST /api/demo/request`); approval flow documented under Environment
- **Login** — email/password sign-in (same form as legacy login page)

Legacy **`/demo`** redirects to `/` (or `/?tab=login` when `?tab=login`).

### Sign In

Sign in with the email and password for a user that exists in your Supabase project (create users in the Supabase dashboard or your usual provisioning flow). The app loads **role** (and org) from the **`public.users`** row whose `id` matches the auth user UUID. After a successful sign-in, routing depends on that role:

- **Admin** → `/dashboard`
- **Client** → `/client/projects`

### Forgot Password

The sign-in form includes a `Forgot password?` flow:

1. Click `Forgot password?` to switch to reset mode
2. Enter email and send reset link
3. Open the Supabase reset email
4. The link verifies via `/auth/confirm` (server-side session exchange), then lands on `/auth/reset-password`
5. Enter and confirm your new password on the reset page
6. You are redirected into the app:
  - admin -> `/dashboard`
  - client/user -> `/client/projects`

**Supabase Auth email templates (branded):** All auth emails should use the smartA.R.S.E. layout from `lib/email/supabase/`. In development, preview every template at **`http://localhost:3000/dev/emails`** — select a template in the sidebar, then copy the Supabase HTML from the code pane to paste into the dashboard.


| Dashboard template | Subject                                |
| ------------------ | -------------------------------------- |
| Reset password     | Reset your smartA.R.S.E. password      |
| Confirm signup     | Confirm your smartA.R.S.E. account     |
| Magic link         | Your smartA.R.S.E. sign-in link        |
| Invite user        | You have been invited to smartA.R.S.E. |
| Change email       | Confirm your new smartA.R.S.E. email   |


Full setup steps: [`lib/email/supabase/README.md`](lib/email/supabase/README.md). Set the sender display name to **smartA.R.S.E.** Emails load the logo from `{{ .SiteURL }}/client-header-logo.gif` — ensure `public/client-header-logo.gif` is deployed.

**Reset password link (required):** In **Authentication → Email Templates → Reset password**, the action link must use `token_hash` verification (not `{{ .ConfirmationURL }}` alone):

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password
```

This uses `token_hash` verification on the server so the link works even when opened from an email app in a different browser context (PKCE `code` exchange requires the same browser that requested the reset). The branded HTML for all auth templates is generated in code — use `/dev/emails` to copy it.

### Email template preview (development)

With `pnpm dev` running, open **`http://localhost:3000/dev/emails`** to preview all app and Supabase templates without sending mail. Edit layout code under `lib/email/` and refresh the page to iterate. The route returns 404 in production.

## Project Structure

```
├── app/
│   ├── (dashboard)/          # Admin dashboard (sidebar, header)
│   │   ├── dashboard/        # Main dashboard overview
│   │   ├── projects/         # Project list
│   │   ├── projects/[id]/    # Admin project detail (chat, documents, personas, settings)
│   │   ├── users/            # User management
│   │   ├── organizations/    # Organization management
│   │   ├── demo-requests/    # Demo access approval queue
│   │   ├── analytics/        # Analytics (mock data)
│   │   ├── settings/         # Admin account settings
│   │   │   └── support-notifications/  # Support alert toggles + delivery log
│   │   ├── faq/              # Internal FAQ (dashboard shell)
│   │   └── privacy/          # Redirects to /help/privacy
│   ├── client/               # Client-facing area (branded shell)
│   │   ├── projects/         # Project list + search
│   │   ├── projects/[id]/    # Client project detail (chat, history card, persona sidebar)
│   │   └── settings/         # Client password / profile settings
│   ├── auth/
│   │   ├── confirm/          # Server-side auth token/code exchange (email links)
│   │   ├── callback/         # Client auth callback handler
│   │   ├── reset-password/   # Password reset after recovery session
│   │   └── demo-setup/       # Demo user first-login password setup
│   ├── api/
│   │   ├── n8n/              # n8n webhook proxy (POST)
│   │   ├── chat/             # history, result, poll, persist, cancel, n8n-complete, promote-draft
│   │   ├── audience/saved/   # Custom audience CRUD
│   │   ├── focus-group/sessions/  # Focus group session lifecycle
│   │   ├── credits/          # charge-focus-group-round
│   │   ├── demo/             # request, approve, reject, session, password setup
│   │   ├── admin/            # users, demo-requests, demo-project, platform-settings, support-notification-logs, projects/*
│   │   └── cron/             # pause-expired-projects, expire-demo-requests, support-notifications*
│   ├── demo/                 # Legacy redirect → /
│   ├── dev/emails/           # Email template preview (dev only)
│   ├── help/                 # Public legal/help (FAQ, privacy, terms, cookies)
│   ├── layout.tsx            # Root layout, fonts, AuthProvider
│   └── page.tsx              # Unified login + demo request (signed-out entry)
├── components/
│   ├── client/               # Client shell + project-detail (chat, sidebar tabs, history card)
│   ├── chat/                 # Chat window, input, citations, markdown prose
│   ├── dashboard/            # Admin project cards, filters, demo requests
│   ├── help/                 # Public FAQ/legal page shells
│   ├── layout/               # Dashboard sidebar, header, mobile sidebar
│   ├── organizations/        # Org table + modals
│   ├── projects/             # Shared project UI (e.g. project users)
│   ├── settings/             # Settings sections (password, notifications)
│   ├── upload/               # File dropzone, documents/personas upload (per-project)
│   └── ui/                   # Radix-based UI primitives
├── hooks/                    # useChatHistory, useChatQuestion, useFocusGroupRound, useDemoSession, …
├── lib/
│   ├── api/                  # Route helpers, require-* guards, chat payload/history
│   ├── auth/                 # Role helpers, safe redirect paths
│   ├── chat/                 # Inline citations, citation tooltips
│   ├── demo-access/          # Demo request, provision, tokens, email templates
│   ├── email/                # Resend layout, Supabase-branded templates, preview samples
│   ├── legal/                # Terms, privacy, cookie policy content
│   ├── personas/             # Segment mocks, display, canonical segments
│   ├── support-notifications/ # Platform settings, evaluate, send, cron processing
│   ├── supabase/             # Client, server, admin, domain modules (projects, documents, personas, custom-audiences, …)
│   ├── auth-context.tsx      # Auth state, login/logout, role-aware helpers
│   ├── chat-history.ts       # Client fetch helper for /api/chat/history
│   ├── credits.ts            # Focus-group credit pricing constants
│   ├── mock-data.ts          # Fallback users, clients, projects, files, conversations
│   ├── project-status.ts     # Live/paused/access-until helpers
│   ├── types.ts              # Shared TypeScript types
│   └── utils.ts              # Utilities (cn, etc.)
├── supabase/
│   └── migrations/           # SQL migrations (RLS, credits, chat_results, focus_groups, demo access, …)
└── public/                   # Static assets
```

## Persona System

The client project detail includes a **Persona panel** (right sidebar, **Personas** tab) for applying research context to chat.

### Segment personas

Each segment persona represents a survey-derived segment with:

- Segment code and title (e.g., "The Muddled Middle Majority")
- Survey sample size and percentage
- Average concern level and sustainable actions
- Voice quotes and interview excerpts
- Top barriers
- Suggested questions

When a persona is applied, the AI responds as a representative of that segment. Persona activation and end events appear inline in the chat timeline.

### Custom audiences

Users can compose **custom audiences** from multiple segments (audience builder in the persona panel), explore in chat before saving, and persist saved audiences via **`/api/audience/saved`**. Applied audiences show a stacked segment chip in chat and chat history.

### Focus groups

**Focus groups** run multi-participant sessions (2+ segment personas) on a topic with UK/US country context. Sessions are created via **`/api/focus-group/sessions`**; each round debits credits up-front (2 per participant). While active, persona/custom-audience modes are locked. Completed sessions collapse to a single row in chat history; admins can open the full transcript.

### Citations

Assistant replies render **inline citation chips** linked to source documents, survey codes, or interview excerpts. Citation metadata travels with `chat_results` and is restored on history reload.

## Development Workflow

Use this branch flow to keep integration testing separate from production:

`feature/*` -> `staging` -> `main`

- Create feature branches from `main` (for example `feature/chat-history-pagination`)
- Open PRs from `feature/*` into `staging` for integration testing
- Deploy `staging` to the staging environment (`staging.smartarse.io` on Vercel)
- After validation, open a PR from `staging` into `main`
- Only `main` deploys to production

Recommended PR flow:

1. Sync local `main`
2. Branch from `main` (`feature/<name>`)
3. Implement + test locally
4. Open PR to `staging`
5. Validate on `staging.smartarse.io`
6. Merge `staging` to `main` for production release

## Scripts


| Command       | Description                  |
| ------------- | ---------------------------- |
| `pnpm dev`    | Start dev server (Turbopack) |
| `pnpm build`  | Production build             |
| `pnpm start`  | Start production server      |
| `pnpm test`   | Run Vitest unit tests        |


## Environment

Create `.env.local` from [`.env.example`](.env.example) with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Optional: override cookie policy URL on demo flow (default: /help/cookies)
# NEXT_PUBLIC_DEMO_COOKIE_POLICY_URL=
```

**Client project chat (n8n)** — required for the `/api/n8n` proxy (server-only; never expose the webhook URL in the browser):

```env
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/...
N8N_WEBHOOK_SECRET=your_shared_webhook_secret
```

The proxy adds `x-webhook-secret` when forwarding to n8n. Set **`N8N_WEBHOOK_URL`** (server-only) — do not use `NEXT_PUBLIC_N8N_*` variables; those embed the webhook URL in the browser bundle.

**Server-only** (admin provisioning, service role, long-running chat completion, cron):

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# Optional: n8n → app callback for async / long workflows (see agent-os n8n coordination doc)
CHAT_N8N_CALLBACK_SECRET=your_shared_secret
# Alias also supported: N8N_CHAT_CALLBACK_SECRET
# Optional: protects GET /api/cron/pause-expired-projects (Vercel Cron uses Authorization: Bearer ...)
CRON_SECRET=your_cron_secret
```

**Demo access** (manual approval + magic links — see [`agent-os/specs/2026-05-19-1200-demo-access-flow/smoke-test-checklist.md`](agent-os/specs/2026-05-19-1200-demo-access-flow/smoke-test-checklist.md)):

```env
DEMO_APPROVAL_SECRET=long_random_secret_for_hmac_email_links
# Optional: override support inbox for demo approve/reject emails (e.g. your address while testing)
DEMO_NOTIFICATION_EMAIL=you@example.com
DEMO_REQUEST_TTL_DAYS=7
DEMO_APPROVAL_TOKEN_TTL_HOURS=72
EMAIL_PROVIDER_API_KEY=re_...
# Optional: transactional sender on your verified domain (see sender vs support inbox below)
EMAIL_FROM_ADDRESS=smartA.R.S.E. <noreply@your-verified-domain.com>
NEXT_PUBLIC_APP_URL=https://your-production-domain
```

**Demo email sender vs support inbox**

- All transactional email (demo notifications, magic links, rejections, and support alerts) is sent **From** `noreply@disrupt-insight.com` (or `noreply@<your-domain>` derived from the support inbox domain).
- **Reply-To** on every message is the support inbox (`smart-arse@disrupt-insight.com`) so replies reach the team.
- Internal alerts are delivered **To** `smart-arse@disrupt-insight.com` (or `DEMO_NOTIFICATION_EMAIL` when testing). Prospect emails go **To** the requester's address.
- Set `EMAIL_FROM_ADDRESS` to a `Name <noreply@…>` value to customize the display name; the mailbox must be `noreply@` on your verified domain.
- Only `noreply@` needs to be a verified Resend sender; the support inbox is used as Reply-To only.

**Resend / email troubleshooting**

- Production requires a **verified sending domain** in [Resend → Domains](https://resend.com/domains). `EMAIL_FROM_ADDRESS` (or the default `noreply@…`) must use an address on that domain after DNS verification.
- Until the domain is verified, local testing can use Resend’s sandbox sender:

```env
EMAIL_RESEND_SANDBOX=true
```

This sends from `onboarding@resend.dev`. Resend may only deliver to the **email on your Resend account** until a domain is verified — set `DEMO_NOTIFICATION_EMAIL` to that address for approval notifications. Magic links to other prospect addresses also require a verified domain.

- The demo request form on **`/`** always shows success even if the notification email fails (anti-enumeration). Check the terminal running `pnpm dev` for `[demo/request] notification email failed:` or approve from **Demo requests** to see Resend errors in the UI.

**Support notifications** (low credits + access expiry — see `[agent-os/specs/2026-06-02-1200-disrupt-support-email-notifications/plan.md](agent-os/specs/2026-06-02-1200-disrupt-support-email-notifications/plan.md)`):

- Admin settings: `/settings/support-notifications` — **Settings** tab (support inbox + three toggles) and **Logs** tab (paginated delivery history via `GET /api/admin/support-notification-logs`).
- Per-project threshold: project **Settings → Credits → Email support when balance below**.
- Changing a project's **Access until** clears prior 28d/14d expiry log rows so the daily cron can re-send against the new date.
- Uses the same `EMAIL_PROVIDER_API_KEY` / Resend setup as demo access.
- `DEMO_NOTIFICATION_EMAIL` overrides the support inbox for all internal notification emails during testing.
- Scheduled jobs (require `CRON_SECRET`):
  - `GET /api/cron/support-notifications` — daily 02:30 UTC (after London midnight) — 28d / 14d access expiry reminders (London calendar)
  - `GET /api/cron/support-notifications-outbox` — every 15 minutes — pending low-credit emails queued by the DB trigger
- Manual cron test:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/cron/support-notifications-outbox"
```

Important notes:

- `NEXT_PUBLIC_*` variables are required for browser auth flows (sign in, forgot password, password update).
- `SUPABASE_SERVICE_ROLE_KEY` is required for `POST /api/admin/users` (admin user provisioning).
- **Demo magic-link expiry** is configured in Supabase Auth (email OTP / magic link expiry), not per-request in app code. Set it to `86400` seconds (24 hours) to match demo email copy.
- **Row-level security on `public.users`:** enable a policy so each signed-in user can **read their own profile row** (for example `USING (auth.uid() = id)` on `SELECT`). If `SELECT` is denied, the app **signs the user out** rather than inferring role from JWT metadata.
- Apply project migrations in `supabase/migrations/` so admin RLS, project lifecycle (status, credits, `access_until`), and related helpers are enforced consistently.
- In Supabase Auth settings, allow these redirect URLs:
  - `http://localhost:3000/auth/confirm`
  - `https://<your-production-domain>/auth/confirm`
  - `http://localhost:3000/auth/reset-password`
  - `https://<your-production-domain>/auth/reset-password`
  - `http://localhost:3000/auth/callback`
  - `https://<your-production-domain>/auth/callback`
  - `http://localhost:3000/auth/demo-setup`
  - `https://<your-production-domain>/auth/demo-setup`

## Security notes

- **Session cookies:** Mutating API routes rely on Supabase session cookies without separate CSRF tokens. SameSite cookie defaults mitigate cross-site POST; keep production on HTTPS.
- **Integration secrets:** Rotate `CHAT_N8N_CALLBACK_SECRET`, `CRON_SECRET`, and `DEMO_APPROVAL_SECRET` if exposure is suspected. The n8n callback can write chat results for any validated user when the secret is valid — treat it like a service credential.
- **Security audit:** See `[agent-os/specs/2026-06-10-1200-full-app-security-audit/report/](agent-os/specs/2026-06-10-1200-full-app-security-audit/report/)` for the latest assessment.

## License

Proprietary — Disrupt Insight.