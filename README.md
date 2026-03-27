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
- ✅ **Admin user provisioning API**: Admin can create users with temporary passwords via secure server route
- ✅ **RLS-backed admin workflows**: Policies and constraints enforce role checks and org-safe data relationships
- ✅ **Forgot password flow**: Send reset email from sign-in, recover session from email link, and land on settings to update password
- 🟡 **AI chat with personas**: Persona UX is implemented; full AI/RAG integration is still evolving
- 🟡 **Tabbed project sidebar (client)**: Right column uses **Chat History** and **Personas** tabs (line-style tabs); **Studio** is scaffolded but hidden until ready. Mobile uses the same tabbed shell inside the overlay drawer.
- 🟡 **Chat history (past questions)**: Grouped list UI and mock data (`HistoryGroup`, `HistoryItem`, `ChatHistoryMockList`); server routes, polling, and n8n re-run flow are specified in product notes and still to wire end-to-end.
- 🟡 **Document-based queries**: Upload and selection UX exists; production document-grounded query backend is still evolving
- 🟡 **Credit system**: Balance and management surfaces exist; end-to-end consumption lifecycle is still evolving

## Current Progress Snapshot

- **Implemented in app + Supabase**:
  - Auth/session routing with admin/client role-aware redirects
  - Organizations dashboard wired to Supabase (create/update/soft delete via status)
  - Users dashboard wired to Supabase for org assignment and admin-only user creation
  - Server route for admin user creation: `POST /api/admin/users`
  - Supabase migrations for admin RLS and active-with-organization constraints
- **Recent client UX**:
  - `components/ui/tabs.tsx` supports a **`line`** variant on `TabsList` for underline-style tabs (default pill tabs unchanged for persona sub-tabs).
  - Client project detail: `ProjectSidebarTabs` in `components/client/project-detail/` drives the right column; chat history selection can call back into the main chat (mock re-run hookup until APIs land).
- **Still evolving**:
  - Chat history: `GET /api/chat/history`, poll/claim endpoints, hooks, and org-scoped webhook payloads per `agent-os/product/dev-notes/chat-history-spec.md` (see also `agent-os/specs/2026-03-26-tabbed-sidebar-chat-history/`).
  - Full AI/RAG backend integration and credit consumption lifecycle
  - Expanded analytics beyond current shell/reporting surfaces

### Product specs (agent-os)

Detailed feature plans, standards, and references live under [`agent-os/`](agent-os/) (e.g. chat history, Supabase admin flows, client project detail). Use those folders when implementing or extending a feature beyond what this README summarizes.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI**: React 19, [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **Forms**: React Hook Form, Zod, `@hookform/resolvers`
- **State**: React Context (auth), local component state
- **Auth**: [Supabase Auth](https://supabase.com/docs/guides/auth)
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
│   │   └── projects/[id]/    # Client project detail (chat + tabbed sidebar: history / personas)
│   ├── auth/
│   │   └── reset-password/   # Supabase recovery callback + redirect to settings
│   ├── api/
│   │   └── admin/users/      # Admin-only user creation endpoint
│   ├── help/                 # Public help pages (FAQ, privacy, contact)
│   ├── layout.tsx            # Root layout, fonts, AuthProvider
│   └── page.tsx              # Login / redirect
├── components/
│   ├── client/               # Client-specific UI (project cards, chat, persona drawer, project sidebar tabs)
│   ├── chat/                 # Admin chat + shared history UI (window, input, sidebar, document selector, history groups/items, mock list)
│   ├── layout/               # Dashboard sidebar, header, mobile sidebar
│   ├── settings/             # Settings sections
│   ├── upload/               # File dropzone, file list
│   └── ui/                   # Radix-based UI primitives
├── lib/
│   ├── auth-context.tsx      # Auth state, login/logout, role-aware helpers
│   ├── mock-data.ts          # Users, clients, projects, files, conversations
│   ├── supabase/
│   │   ├── client.ts         # Browser Supabase client
│   │   ├── organizations.ts  # Organizations dashboard data/mutations
│   │   ├── users.ts          # Users dashboard data/mutations
│   │   ├── server.ts         # Server-side Supabase client from cookies
│   │   └── admin.ts          # Service-role Supabase admin client
│   │   └── fetch-user-profile.ts  # Load `public.users` row after auth
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

Optional (server-side integrations only):

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
N8N_WEBHOOK_URL=your_n8n_webhook_url
```

Important notes:

- `NEXT_PUBLIC_*` variables are required for browser auth flows (sign in, forgot password, password update).
- `SUPABASE_SERVICE_ROLE_KEY` is required for `POST /api/admin/users` (admin user provisioning).
- **Row-level security on `public.users`:** enable a policy so each signed-in user can **read their own profile row** (for example `USING (auth.uid() = id)` on `SELECT`). If `SELECT` is denied, the app falls back to JWT metadata or mock email matching, and **routing may not match the row you see in the Table Editor**.
- Apply project migrations in `supabase/migrations/` so admin RLS and active-with-organization constraints are enforced consistently.
- In Supabase Auth settings, allow these redirect URLs:
  - `http://localhost:3000/auth/reset-password`
  - `https://<your-production-domain>/auth/reset-password`

## License

Proprietary — Disrupt Insight.
