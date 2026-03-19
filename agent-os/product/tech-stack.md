# smartA.R.S.E. — Tech Stack

Stack as implemented in this repository (`package.json` and app structure). A greenfield variant might use Vite + React Router instead; this repo is **Next.js**. No `agent-os/standards/global/tech-stack.md` was present to inherit from.

## Frontend

- **Next.js** (App Router) — `next dev --turbo`, pages under `app/`
- **React** 19
- **TypeScript**
- **Tailwind CSS** (+ `tailwindcss-animate`, `@tailwindcss/postcss`)
- **UI**: Radix UI primitives, **lucide-react** icons, **class-variance-authority** / **clsx** / **tailwind-merge**
- **Forms**: **react-hook-form**, **zod**, **@hookform/resolvers**
- **Theming**: **next-themes**
- **Toasts**: **sonner**
- **Charts**: **recharts** (e.g. analytics)
- **Other UI**: **cmdk**, **vaul**, **embla-carousel-react**, **react-day-picker** / **date-fns**, **input-otp**, **react-resizable-panels**

## Backend

- **Next.js** server capabilities only in this repo today; **no separate API service** or serverless handlers observed for core product logic. Auth and data are **client-side mock** (`lib/mock-data`, `lib/auth-context`).
- **MVP target integrations (planned/contracted):**
  - **Supabase Auth + Supabase DB** for login/session, org settings, credits, history, audience data (org isolation via Supabase RLS scoped by `organization_id`).
  - **n8n webhook** for AI chat: the browser calls `N8N_WEBHOOK_URL` for all chat queries (main + persona mode).
  - **Optional Vercel API routes** (if you have an existing Next.js backend): `VERCEL_API_BASE_URL` endpoints for credits/history/audience/persona/interviews/podcast, plus chat helpers like `/api/chat/poll` and `/api/chat/claim`.
  - **Security constraints:** never expose `SUPABASE_SERVICE_ROLE_KEY` in the browser bundle; use `SUPABASE_ANON_KEY` with RLS. Include `org_id` (from `users.organization_id`) in all chat webhook payloads.

## Database

- **MVP target:** Supabase DB with RLS. Data access is scoped to the user’s org using `organization_id` (passed as `org_id` in webhook payloads for AI requests).
- **Credits model:** credits are consumed server-side on successful AI calls; client display is read-only beyond the MVP shell.

## Other

- **Package manager**: **pnpm** (lockfile / workspace hints).
- **Lint**: `next lint`.
- **Agent OS**: Commands under `.claude/commands/agent-os/`; standards index at `agent-os/standards/index.yml`.
