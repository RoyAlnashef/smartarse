# Standards for project document upload and storage

The following standards apply to this work. Snapshotted from the repo for traceability.

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
