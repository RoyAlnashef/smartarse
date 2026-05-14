# Standards for Sign-in + client theme

The following standards apply to this work.

---

## css/ui-styling

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

## global/app-routing-protected-shell

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

**Spec note:** This spec updates post-auth redirect to be **role-aware** (admin → `/dashboard`, client/user → `/client/projects`).

## Protected shell (`app/(dashboard)/layout.tsx`)

- **`"use client"`** — same auth hook pattern.
- `isLoading` → same spinner.
- Not authenticated → `router.replace("/")` + spinner until redirect.
- Authenticated → sidebar + header + `<main>{children}</main>`.

**Layout enforces login only**, not roles. Admin/client checks stay on **pages** (or future middleware).

**Spec note:** Client/user should be redirected out of this layout to `/client/projects` when implemented.

## Redirects

- Auth churn: **`router.replace`**, not `push` — avoids back-button loops.

## New dashboard routes

- Add under `app/(dashboard)/<segment>/page.tsx` — they automatically get the shell and auth gate.

## MVP note

- Today, protection is **client-only**. Add **middleware + server session** (e.g. Supabase) for real enforcement; keep this layout UX for hydration.
