# Standards snapshot (2026-04-13)

Full text copied from [`agent-os/standards/global/domain-data-layer.md`](../../standards/global/domain-data-layer.md) and [`agent-os/standards/global/project-conventions.md`](../../standards/global/project-conventions.md) for offline spec reading.

---

## Domain model & data layer

_Source: `agent-os/standards/global/domain-data-layer.md`_

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

## Project conventions

_Source: `agent-os/standards/global/project-conventions.md`_

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
