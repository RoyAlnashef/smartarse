# Standards for Admin Project Chat History

The following standards apply to this work.

---

## global/domain-data-layer

# Domain model & data layer

## Source of truth

- **Types**: `lib/types.ts` — all entities agents and Supabase schemas should align with.
- **Mock seed**: `lib/mock-data.ts` — until DB exists, lists mirror production shapes.

## Entities (summary)

| Type           | Key fields / notes                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `User`         | `role`, optional `organization_id`, `status`, timestamps                                                            |
| `Organization` | `projectIds`, `userIds`, org-level credits                                                                          |
| `Project`      | `organization_id`, `organizationName` denorm, `assignedUserIds`, `uploadedFileIds`, credits, `status` live/archived |
| `UploadedFile` | `projectId`, `status` processing/ready/error                                                                        |
| `Conversation` | `projectId`, nested `messages[]` (client may normalize to separate table later)                                     |
| `ChatMessage`  | `role` user/assistant, optional `documentIds` for RAG context                                                       |
| `QueryLog`     | analytics / credit audit trail                                                                                      |
| `FAQItem`      | static content                                                                                                      |

## IDs

- String IDs (`u1`, `c1`, `p1`, …) in mock — **replace with UUIDs** in Supabase; keep TypeScript as `string`.

## Relations (mental model)

```
Organization 1—* Project *—* UploadedFile
Organization 1—* User (admin/client/user roles)
Project *—* assignedUserIds → User
```

## When adding fields

1. Update `lib/types.ts`.
2. Update mock rows + any `getVisibleProjects` / filters if behavior changes.
3. Plan migration for Supabase columns + RLS.

## Chat / credits

- Credits live on **Project** (and summary on **Organization** in mock). Server must decrement on AI calls; client display is read-only beyond MVP shell.

---

## javascript/auth-rbac

# Auth & RBAC

## Roles

`UserRole`: `"admin"` | `"client"` | `"user"`.

| Role | Meaning |
|------|---------|
| `admin` | Full platform; all projects. |
| `client` | Org lead; projects where `project.organization_id === user.organization_id`. |
| `user` | End user; projects in `project.assignedUserIds`. |

## API surface (`useAuth`)

- `user`, `isAuthenticated`, `isLoading`
- `login(email)` → `User | null` (mock: match `users` by email, case-insensitive)
- `logout()` — clears session
- `switchRole(role)` — **dev/demo only**: swaps to a fixed mock user per role (`roleDefaults`)
- `getVisibleProjects()` — **single source** for project lists by role
- `getClientForUser()` — org/client row for `client`/`user` with `organization_id` (maps to `users.organization_id` in Supabase)

## Rules

- `AuthProvider` / `useAuth` are client-side conveniences layered on top of Supabase Auth (no custom auth backend).
- **`useAuth()`** must run under `AuthProvider` — throws otherwise.
- **Persist minimal payload**: store `{ id }` only; re-hydrate full `User` from canonical source (today mock `users`; later Supabase).
- **Session key** (current): `sessionStorage` key `disrupt-user` — **rename to a smartA.R.S.E. key** when moving off mock (e.g. rely on Supabase session; avoid duplicate client-only keys for security-sensitive flows).

## Page-level RBAC

- **Layout** does not check roles. For admin-only routes (e.g. `/upload`), gate in the page: early return “Access Denied” or redirect.
- **Nav**: filter links by `roles` array (see sidebar pattern) — keep nav and route guards in sync.

## MVP migration

- Replace mock `login` with Supabase Auth; map JWT/app user to same `User` shape in `lib/types.ts`.
- Enforce roles **server-side** (RLS / API), not only client checks.

---

## global/app-routing-protected-shell

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

---

## global/project-conventions

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
