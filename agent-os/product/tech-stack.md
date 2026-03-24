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

- **Next.js Route Handlers**: server endpoint implemented at `app/api/admin/users/route.ts` for admin-only user provisioning.
- **Supabase (active in current build)**:
  - Auth/session via browser + server clients (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
  - Admin service-role operations (`lib/supabase/admin.ts`) for secure user creation flow
  - Dashboard org/user data + mutations (`lib/supabase/organizations.ts`, `lib/supabase/users.ts`)
- **MVP integrations still in progress:**
  - **n8n webhook** for AI chat (`N8N_WEBHOOK_URL`) across main + persona mode
  - Optional external API bridge (`VERCEL_API_BASE_URL`) for advanced credits/history/audience features
- **Security constraints:** never expose `SUPABASE_SERVICE_ROLE_KEY` in the browser bundle; keep service-role usage server-only. Use anon key + RLS for user-scoped reads/writes. Include `org_id` (from `users.organization_id`) in all chat webhook payloads.

## Database

- **Supabase DB with RLS** is now partially implemented for admin/org/user management.
- **Migrations in repo** include:
  - `202603232355_admin_rls_users_organizations.sql` (admin RLS helper + policies)
  - `202603240010_active_requires_organization.sql` (active user/project org constraints)
- **Org scoping model:** user access remains scoped by `organization_id` (also passed as `org_id` in AI webhook payloads).
- **Credits model:** server-side consumption remains the target behavior; UI currently surfaces credit balance and management primitives.

## Other

- **Package manager**: **pnpm** (lockfile / workspace hints).
- **Lint**: `next lint`.
- **Agent OS**: Commands under `.claude/commands/agent-os/`; standards index at `agent-os/standards/index.yml`.
