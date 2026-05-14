# App routing & protected shell

## URLs vs folders

| URL                                          | Folder              |
| -------------------------------------------- | ------------------- |
| `/`                                          | `app/page.tsx`      |
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

**Layout enforces login only**, not roles. Admin/client checks stay on **pages** (or future middleware), but API/data access must still be enforced server-side (Supabase session + RLS).

## Redirects

- Auth churn: **`router.replace`**, not `push` — avoids back-button loops.

## New dashboard routes

- Add under `app/(dashboard)/<segment>/page.tsx` — they automatically get the shell and auth gate.

## MVP note

- Today, the layout/auth gate is **client-only UX**. Real enforcement must be server-side: API/webhook routes require a valid Supabase session cookie or `Authorization` header, and Supabase RLS scopes all data to the user’s org (`organization_id`/`org_id`). Keep this layout UX for hydration/redirect behavior.
