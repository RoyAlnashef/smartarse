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

- **Next.js** server capabilities only in this repo today; **no separate API service** or serverless handlers observed for core product logic. Auth and data are **client-side mock** (`lib/mock-data`, `lib/auth-context`). **MVP target:** Supabase auth + DB + storage (see roadmap).

## Database

- **N/A** in current codebase (mock data in memory / session storage).

## Other

- **Package manager**: **pnpm** (lockfile / workspace hints).
- **Lint**: `next lint`.
- **Agent OS**: Commands under `.claude/commands/agent-os/`; standards index at `agent-os/standards/index.yml`.
