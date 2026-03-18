# Standards for Help pages (FAQ, Privacy, Contact)

The following standards apply to this work.

---

## `global/project-conventions`

# Project conventions (cross-cutting)

## Imports

- Use **`@/`** alias for `app/`, `components/`, `lib/` — no deep relative `../../../` across those roots.

```ts
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
```

## Class merging

- **`cn(...inputs)`** — `clsx` + `tailwind-merge`. Use for `className` on wrappers; ui primitives already use it internally.

## Client vs server

- **`"use client"`** only where hooks, browser APIs, or event handlers are required.
- Prefer Server Components for static content when introducing RSC-friendly pages; current dashboard is mostly client for auth.

## Toasts & theme

- **Toasts**: `sonner` (`Toaster` in tree) for ephemeral feedback — prefer over raw `alert`.
- **Theme**: `next-themes` + `ThemeProvider` if dark mode is enabled; globals use light tokens by default.

## File naming

- Components: **PascalCase** (`ProjectCard.tsx`).
- Utilities / types: **kebab-case** files in `lib/` (`mock-data.ts`, `auth-context.tsx`).

## Product naming in code

- User-facing copy and storage keys should use **smartA.R.S.E.** branding over legacy app names when touched.

---

## `css/ui-styling`

# UI components & styling

## Layers

| Layer | Location | Use |
|-------|----------|-----|
| Primitives | `components/ui/*` | shadcn/Radix — buttons, dialogs, forms, tables. |
| Features | `components/<feature>/` | Domain UI: `chat/`, `dashboard/`, `layout/`, `upload/`, `users/`. |

- Compose features from `@/components/ui/*`. Don’t duplicate primitive patterns in feature folders.

## Tokens

- **Semantic (shadcn)**: `background`, `foreground`, `card`, `muted`, `border`, `primary`, `destructive`, `ring` — driven by CSS vars in `app/globals.css`. Prefer these for forms, cards, body text.
- **Brand**: `mint-*` (accent / CTAs / spinners / progress) and `dark-*` (sidebar shell, strong text). Defined in `tailwind.config.ts`.
- **Charts**: `chart.1` … `chart.5` (mint-scale).

## Class patterns

- **`cn()`** from `@/lib/utils` for any conditional/merged Tailwind on custom markup.
- **Focus**: `focus:border-mint-400 focus:ring-2 focus:ring-mint-300/20` on custom inputs (match existing pages).
- **Radius**: `rounded-lg` for controls/cards unless using ui component defaults.

## Icons & fonts

- **Icons**: `lucide-react` only for nav and feature UI.
- **Typography**: `font-sans` (Inter), `font-serif` (DM Serif) for logo/display accents.

## New components

- New primitive → add under `components/ui/` (shadcn-style: forwardRef, `cn`, Radix if needed).
- Product-specific chrome → feature folder; keep shell (`sidebar`, `header`) in `layout/`.

---

## `global/app-routing-protected-shell`

# App routing & protected shell

## URLs vs folders

| URL | Folder |
|-----|--------|
| `/` | `app/page.tsx` |
| `/dashboard`, `/upload`, `/projects/[id]`, … | `app/(dashboard)/…` |

`(dashboard)` is a **route group** — it does **not** appear in the path.

## Root layout (`app/layout.tsx`)

- **Server Component** only: fonts, `metadata` / `viewport`, `globals.css`.
- Wrap all pages: `<AuthProvider>{children}</AuthProvider>`.

## Public entry (`app/page.tsx`)

- **`"use client"`** — uses `useAuth` + `useRouter`.
- `isLoading` → full-screen spinner (centered, `border-mint-300` ring).
- Authenticated + loaded → `router.replace("/dashboard")` (also show spinner while redirecting).
- Otherwise → `<LoginPage />`.

## Protected shell (`app/(dashboard)/layout.tsx`)

- **`"use client"`** — same auth hook pattern.
- `isLoading` → same spinner.
- Not authenticated → `router.replace("/")` + spinner until redirect.
- Authenticated → sidebar + header + `<main>{children}</main>`.

**Layout enforces login only**, not roles. Admin/client checks stay on pages (or future middleware).

## Redirects

- Auth churn: **`router.replace`**, not `push` — avoids back-button loops.

## New dashboard routes

- Add under `app/(dashboard)/<segment>/page.tsx` — they automatically get the shell and auth gate.

## MVP note

- Today, protection is **client-only**. Add **middleware + server session** (e.g. Supabase) for real enforcement; keep this layout UX for hydration.

