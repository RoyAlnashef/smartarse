# smartA.R.S.E.

**Agentic Research Search Engine** — an AI-powered market research platform by Disrupt Insight. Query your research data using natural language and explore insights through segment-based personas.

## Overview

smartA.R.S.E. is a full-stack web application that lets research teams and their clients interact with market research data through conversational AI. It supports multiple user roles, document-based queries, and a unique **persona system** that lets you "speak" with representative voices of survey segments (e.g., sustainability attitudes, consumer behaviour).

### Key Features

Status legend: ✅ built, 🟡 partial/in progress, ⚪ planned/not built yet

- ✅ **Multi-role access**: Admin and Client roles with role-based routing and permissions
- 🟡 **Admin dashboard**: Project management, user management, file uploads, analytics, settings, FAQ, and privacy
- 🟡 **Client portal**: Branded client experience with project search, project detail, and AI chat
- ✅ **Supabase auth + session**: Sign in/out and session hydration via Supabase Auth
- ✅ **Supabase organizations management**: Admin can create, update, and deactivate organizations from the dashboard
- ✅ **Admin user provisioning API**: Admin can create users with temporary passwords via secure server route; user removal via `DELETE /api/admin/users/[id]`
- ✅ **RLS-backed admin workflows**: Policies and constraints enforce role checks and org-safe data relationships
- ✅ **Forgot password flow**: Send reset email from sign-in, recover session from email link, and land on settings to update password
- 🟡 **Project chat + n8n**: Client chat POSTs to an n8n webhook (`NEXT_PUBLIC_N8N_URL` or `NEXT_PUBLIC_N8N_WEBHOOK_URL`), then `POST /api/chat/persist` and polling via `GET /api/chat/poll` until `chat_results` completes. Long-running workflows can call `POST /api/chat/n8n-complete` when `CHAT_N8N_CALLBACK_SECRET` is set (see `agent-os/specs/2026-03-26-1400-project-chat-n8n-integration/`).
- 🟡 **Tabbed project sidebar (client)**: Right column uses **Chat History** and **Personas** tabs (line-style tabs); **Studio** is scaffolded but hidden until ready. Mobile uses the same tabbed shell inside the overlay drawer.
- 🟡 **Chat history (past questions)**: `GET /api/chat/history` backed by `chat_results`; client page uses `useChatHistory` and merges API rows with in-session items (falls back to mock data when Supabase is off or the list is empty). Spec-level pagination/re-run polish may still evolve.
- 🟡 **Document-based queries**: Upload and selection UX exists; production document-grounded query backend is still evolving
- 🟡 **Credit system**: Balance and management surfaces exist; live projects auto-pause when remaining **credit_balance** hits zero (DB trigger; remaining pool, not “used ≥ allocated”); end-to-end consumption reporting is still evolving
- ✅ **Project access window**: Optional end date (`access_until`, inclusive UTC calendar day). Live projects auto-pause after that day via row triggers, `pause_project_if_access_expired` before chat persist/completion, and a scheduled job (`GET /api/cron/pause-expired-projects`, Vercel Cron in `vercel.json`) when `CRON_SECRET` is set

## Current Progress Snapshot

*Last updated: April 2026.*

- **Implemented in app + Supabase**:
  - Auth/session routing with admin/client role-aware redirects
  - Organizations dashboard wired to Supabase (create/update/soft delete via status); table shows **Projects**, **Users**, and **Chats** per organization
  - Users dashboard wired to Supabase for org assignment and admin-only user creation
  - Server routes: `POST /api/admin/users`, `DELETE /api/admin/users/[id]`
  - Chat routes: `GET /api/chat/history`, `GET /api/chat/result`, `GET /api/chat/poll`, `POST /api/chat/persist`, `POST /api/chat/n8n-complete`
  - Admin project chat helpers: `GET /api/admin/projects/[id]/chat-history`, `GET /api/admin/projects/[id]/chat-result`
  - Scheduled maintenance: `GET /api/cron/pause-expired-projects` (Bearer `CRON_SECRET`) calls `pause_all_projects_expired_access` for batch pause of expired access windows
  - Client hooks: `hooks/useChatHistory.ts`, `hooks/useChatQuestion.ts`
  - Supabase migrations for admin RLS, active-with-organization constraints, project status/credits (including auto-pause when `credit_balance` is 0), storage RLS, `chat_results`, and `access_until` + pause helpers
- **Recent progress**:
  - **Dashboard**: Project cards show assigned user count, **chat count**, optional **Access until**, and a **credits meter** with low-balance warning; meter navigates into project settings for admins. Organization list highlights **Chats** instead of legacy credit/created columns.
  - **Chat UI**: Assistant messages render **Markdown** (GFM: lists, tables, blockquotes, code) via `react-markdown` + `remark-gfm`; rotating status text while a reply is loading; improved contrast and empty states (including admin chat history until load completes).
  - **Project settings**: Credits panel with **Add credits**, low-balance callouts, and refined layout; optional access-until date with clear control; delete-settings layout stabilized.
  - **Client shell**: Tabbed sidebar (`line` variant tabs in `components/ui/tabs.tsx`); `ProjectSidebarTabs` drives Chat History / Personas; API-backed history when Supabase is enabled; access messaging via `accessUntil` + `lib/project-status.ts`
- **Still evolving**:
  - Chat UX: full spec alignment for history pagination, re-run-from-history, and edge cases per `agent-os/product/dev-notes/chat-history-spec.md`
  - Full AI/RAG depth and richer credit analytics
  - Expanded analytics beyond current shell/reporting surfaces

### Product specs (agent-os)

Detailed feature plans, standards, and references live under [`agent-os/`](agent-os/) (e.g. chat history, n8n coordination, Supabase admin flows, client project detail). For end-to-end chat + n8n QA, see [`agent-os/specs/2026-03-26-1400-project-chat-n8n-integration/smoke-test-checklist.md`](agent-os/specs/2026-03-26-1400-project-chat-n8n-integration/smoke-test-checklist.md).

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack via `next dev --turbo`)
- **UI**: React 19, [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **Forms**: React Hook Form, Zod, `@hookform/resolvers`
- **Chat rendering**: `react-markdown` + `remark-gfm` for assistant message Markdown (lists, tables, GFM)
- **State**: React Context (auth), local component state
- **Auth & data**: [Supabase Auth](https://supabase.com/docs/guides/auth), Supabase client + RLS-backed tables
- **Package manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/smart-arse.git
cd smart-arse

# Install dependencies
pnpm install

# Configure environment variables (see Environment section below)
# then start the development server

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Sign In

Sign in with the email and password for a user that exists in your Supabase project (create users in the Supabase dashboard or your usual provisioning flow). The app loads **role** (and org) from the **`public.users`** row whose `id` matches the auth user UUID. After a successful sign-in, routing depends on that role:

- **Admin** → `/dashboard`
- **Client** → `/client/projects`

### Forgot Password

The sign-in form includes a `Forgot password?` flow:

1. Click `Forgot password?` to switch to reset mode
2. Enter email and send reset link
3. Open the Supabase reset email
4. Follow the link to `/auth/reset-password`
5. You are redirected to settings to change password:
   - admin -> `/settings`
   - client -> `/client/settings`

## Project Structure

```
├── app/
│   ├── (dashboard)/          # Admin dashboard (sidebar, header)
│   │   ├── dashboard/        # Main dashboard
│   │   ├── projects/[id]/    # Admin project detail (chat, uploads, settings)
│   │   ├── users/            # User management
│   │   ├── upload/           # Global upload
│   │   ├── analytics/        # Analytics
│   │   ├── settings/         # Admin settings
│   │   ├── faq/              # Internal FAQ
│   │   └── privacy/          # Internal privacy
│   ├── client/               # Client-facing area (branded shell)
│   │   ├── projects/         # Project list + search
│   │   └── projects/[id]/    # Client project detail (chat + tabbed sidebar)
│   ├── auth/
│   │   └── reset-password/   # Supabase recovery callback + redirect to settings
│   ├── api/
│   │   ├── admin/users/      # Admin user creation
│   │   ├── admin/users/[id]/ # Admin user DELETE
│   │   ├── admin/projects/[id]/ # chat-history, chat-result (admin)
│   │   ├── cron/             # pause-expired-projects (scheduled access window enforcement)
│   │   └── chat/             # history, result, poll, persist, n8n-complete
│   ├── help/                 # Public help pages (FAQ, privacy, contact)
│   ├── layout.tsx            # Root layout, fonts, AuthProvider
│   └── page.tsx              # Login / redirect
├── components/
│   ├── client/               # Client UI (project cards, chat, persona drawer, sidebar tabs)
│   ├── chat/                 # Chat window, input, document selector, history list UI
│   ├── dashboard/            # Admin project cards, filters, dialogs
│   ├── layout/               # Dashboard sidebar, header, mobile sidebar
│   ├── organizations/        # Org table + modals
│   ├── projects/             # Shared project UI (e.g. project users)
│   ├── settings/             # Settings sections
│   ├── upload/               # File dropzone, documents/personas upload flows
│   └── ui/                   # Radix-based UI primitives
├── hooks/                    # useChatHistory, useChatQuestion, etc.
├── lib/
│   ├── api/                  # Route helpers (chat history, payloads, require-* guards)
│   ├── auth-context.tsx      # Auth state, login/logout, role-aware helpers
│   ├── mock-data.ts          # Fallback users, clients, projects, files, conversations
│   ├── supabase/
│   │   ├── client.ts         # Browser Supabase client
│   │   ├── server.ts         # Server-side Supabase client from cookies
│   │   ├── admin.ts          # Service-role Supabase admin client
│   │   ├── fetch-user-profile.ts
│   │   ├── organizations.ts
│   │   ├── users.ts
│   │   ├── projects.ts
│   │   ├── documents.ts
│   │   └── personas.ts
│   ├── chat-history.ts       # Client fetch helper for /api/chat/history
│   ├── types.ts              # Shared TypeScript types
│   └── utils.ts              # Utilities (cn, etc.)
├── supabase/
│   └── migrations/           # SQL migrations (RLS policies, constraints)
└── public/                   # Static assets
```

## Persona System

The client project detail includes a **Persona Drawer** that lets users apply segment personas to the chat. Each persona represents a survey-derived segment with:

- Segment code and title (e.g., "The Muddled Middle Majority")
- Survey sample size and percentage
- Average concern level and sustainable actions
- Voice quotes and interview excerpts
- Top barriers
- Suggested questions

When a persona is applied, the AI responds as a representative of that segment. Persona activation and end events appear inline in the chat timeline.

## Scripts

| Command      | Description                  |
| ------------ | ---------------------------- |
| `pnpm dev`   | Start dev server (Turbopack) |
| `pnpm build` | Production build             |
| `pnpm start` | Start production server      |
| `pnpm lint`  | Run ESLint                   |

## Environment

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Client project chat (n8n)** — required for real webhook calls from the browser (either variable is accepted):

```env
NEXT_PUBLIC_N8N_URL=https://your-n8n-instance/webhook/...
# or
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/...
```

**Server-only** (admin provisioning, service role, long-running chat completion, cron):

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# Optional: n8n → app callback for async / long workflows (see agent-os n8n coordination doc)
CHAT_N8N_CALLBACK_SECRET=your_shared_secret
# Alias also supported: N8N_CHAT_CALLBACK_SECRET
# Optional: protects GET /api/cron/pause-expired-projects (Vercel Cron uses Authorization: Bearer ...)
CRON_SECRET=your_cron_secret
```

Important notes:

- `NEXT_PUBLIC_*` variables are required for browser auth flows (sign in, forgot password, password update).
- `SUPABASE_SERVICE_ROLE_KEY` is required for `POST /api/admin/users` (admin user provisioning).
- **Row-level security on `public.users`:** enable a policy so each signed-in user can **read their own profile row** (for example `USING (auth.uid() = id)` on `SELECT`). If `SELECT` is denied, the app falls back to JWT metadata or mock email matching, and **routing may not match the row you see in the Table Editor**.
- Apply project migrations in `supabase/migrations/` so admin RLS, project lifecycle (status, credits, `access_until`), and related helpers are enforced consistently.
- In Supabase Auth settings, allow these redirect URLs:
  - `http://localhost:3000/auth/reset-password`
  - `https://<your-production-domain>/auth/reset-password`

## License

Proprietary — Disrupt Insight.
