# smartA.R.S.E. — Tech Stack

Stack as implemented in this repository (`package.json` and app structure). A greenfield variant might use Vite + React Router instead; this repo is **Next.js**. No `agent-os/standards/global/tech-stack.md` was present to inherit from.

## Frontend

- **Next.js** (App Router) — `next dev --turbo`, pages under `app/`
- **React** 19
- **TypeScript**
- **Tailwind CSS** (+ `tailwindcss-animate`, `@tailwindcss/postcss`)
- **UI**: Radix UI primitives, **lucide-react** icons, **class-variance-authority** / **clsx** / **tailwind-merge**
- **Forms**: **react-hook-form**, **zod**, **@hookform/resolvers**
- **Drag-and-drop / ordering**: **@dnd-kit** (core, sortable, utilities) — e.g. sortable document tables in uploads
- **Markdown (chat)**: **react-markdown**, **remark-gfm**
- **Theming**: **next-themes**
- **Toasts**: **sonner**
- **Charts**: **recharts** (e.g. analytics)
- **Other UI**: **cmdk**, **vaul**, **embla-carousel-react**, **react-day-picker** / **date-fns**, **input-otp**, **react-resizable-panels**

## Backend

- **Next.js Route Handlers** under `app/api/` — examples:
  - Admin: `POST /api/admin/users`, `DELETE /api/admin/users/[id]`, `GET /api/admin/projects/[id]/chat-history`, `GET /api/admin/projects/[id]/chat-result`
  - Chat: `GET/POST` routes under `app/api/chat/` (history, result, poll, persist, n8n-complete)
  - Cron: `GET /api/cron/pause-expired-projects` (Bearer `CRON_SECRET`) — batch pause for expired `access_until` windows
- **Supabase (active in current build)**:
  - Auth/session via browser + server clients (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
  - Admin service-role operations (`lib/supabase/admin.ts`) for secure server flows (user provisioning, RPCs, cron)
  - Org/user/project data + mutations (`lib/supabase/organizations.ts`, `lib/supabase/users.ts`, `lib/supabase/projects.ts`, etc.)
- **n8n + chat (browser → workflow → app)**:
  - Webhook URL from **`NEXT_PUBLIC_N8N_URL`** or **`NEXT_PUBLIC_N8N_WEBHOOK_URL`** (see `lib/n8n-webhook-url.ts`) — not the legacy `N8N_WEBHOOK_URL` name used in some older docs.
  - Long-running workflows: server **`CHAT_N8N_CALLBACK_SECRET`** (alias **`N8N_CHAT_CALLBACK_SECRET`**) enables **`POST /api/chat/n8n-complete`** for async completion (see `agent-os/specs/2026-03-26-1400-project-chat-n8n-integration/`).
- **Not wired in this codebase:** **`VERCEL_API_BASE_URL`** — appears in older developer guidelines as a placeholder for calling hosted API routes; the app uses same-origin `/api/...` and Supabase instead.
- **Security constraints:** never expose `SUPABASE_SERVICE_ROLE_KEY` in the browser bundle; keep service-role usage server-only. Use anon key + RLS for user-scoped reads/writes. Include `org_id` (from `users.organization_id`) in all chat webhook payloads.

## Database

- **Supabase DB with RLS** for admin/org/user flows, projects, documents, personas, and chat persistence.
- **Migrations** live in `supabase/migrations/` and cover themes such as: admin RLS helpers, org constraints, project status/credits, storage buckets + RLS, `chat_results`, optional **`access_until`** and pause helpers — apply the full folder for a consistent environment (do not rely on two sample filenames alone).
- **Org scoping model:** user access remains scoped by `organization_id` (also passed as `org_id` in AI webhook payloads).
- **Credits & access:** allocated credits can **auto-pause** live projects when depleted (trigger). Optional **`access_until`** (UTC calendar day) also drives pause via triggers, RPCs before chat routes, and the cron job above.

## Hosting & scheduling

- **Vercel**: `vercel.json` defines a daily cron calling `GET /api/cron/pause-expired-projects` (requires `CRON_SECRET` on the server). Adjust schedule/host if you deploy elsewhere.

## Other

- **Package manager**: **pnpm** (lockfile / workspace hints).
- **Lint**: `next lint`.
- **Agent OS**: Commands under `.claude/commands/agent-os/`; standards index at `agent-os/standards/index.yml`.
