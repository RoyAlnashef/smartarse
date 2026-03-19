# Standards — Persona drawer in client chat

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
- **Client area**: `arse-*` tokens and `font-arse-body` / `font-arse-title` on `/client/*` routes — use these for the persona drawer inside `ProjectChat`.

## Class patterns

- **`cn()`** from `@/lib/utils` for any conditional/merged Tailwind on custom markup.
- **Focus**: match existing client inputs (`focus:ring-arse-magenta`, etc.) where the drawer lives in client chat.
- **Radius**: align with parent chat surface (`rounded-3xl` outer); inner cards may use `rounded-xl` / `rounded-2xl` for consistency.

## Icons & fonts

- **Icons**: `lucide-react` only for nav and feature UI.
- **Typography**: client chat uses `font-arse-*`; dashboard uses `font-sans` / `font-serif` per globals.

## New components

- New primitive → add under `components/ui/` (shadcn-style: forwardRef, `cn`, Radix if needed).
- Product-specific chrome → feature folder; persona drawer belongs under `components/client/project-detail/`.

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

## global/domain-data-layer (future integration)

When persisting persona selection or segment metadata, align with:

- **Types**: `lib/types.ts`
- **Mock seed**: `lib/mock-data.ts`

See full standard: `agent-os/standards/global/domain-data-layer.md`.
