# Standards for Dashboard Chat History Parity

The following standards apply to this work.

---

## css/ui-styling

**Why it applies:** the new tooltip body, focus-group row layout, and admin focus-group transcript bubbles must reuse `components/ui/*` primitives (`Tooltip*`) and existing tokens (`border-border`, `text-muted-foreground`, persona color tokens). No new primitives are introduced.

```markdown
# UI components & styling

## Layers

| Layer | Location | Use |
|-------|----------|-----|
| Primitives | `components/ui/*` | shadcn/Radix — buttons, dialogs, forms, tables. |
| Features | `components/<feature>/` | Domain UI: `chat/`, `dashboard/`, `layout/`, `upload/`, `users/`. |

- Compose features from `@/components/ui/*`. Don't duplicate primitive patterns in feature folders.

## Tokens

- **Semantic (shadcn)**: `background`, `foreground`, `card`, `muted`, `border`, `primary`, `destructive`, `ring` — driven by CSS vars in `app/globals.css`. Prefer these for forms, cards, body text.
- **Brand**: `mint-*` (accent / CTAs / spinners / progress) and `dark-*` (sidebar shell, strong text). Defined in `tailwind.config.ts`.

## Class patterns

- **`cn()`** from `@/lib/utils` for any conditional/merged Tailwind on custom markup.
- **Radius**: `rounded-lg` for controls/cards unless using ui component defaults.

## Icons & fonts

- **Icons**: `lucide-react` only for nav and feature UI.
```

---

## global/project-conventions

**Why it applies:** new files (`lib/admin-project-focus-group-session.ts`, `components/chat/admin-focus-group-transcript.tsx`, new API route) must follow the import-alias, `cn`, client-boundary, and naming conventions.

```markdown
# Project conventions (cross-cutting)

## Imports

- Use **`@/`** alias for `app/`, `components/`, `lib/` — no deep relative `../../../` across those roots.

## Class merging

- **`cn(...inputs)`** — `clsx` + `tailwind-merge`. Use for `className` on wrappers; ui primitives already use it internally.

## Client vs server

- **`"use client"`** only where hooks, browser APIs, or event handlers are required.

## File naming

- Components: **PascalCase** (`AdminFocusGroupTranscriptRound.tsx` style for the exported component, kebab-case for the file: `admin-focus-group-transcript.tsx`).
- Utilities / types: **kebab-case** files in `lib/`.

## Product naming in code

- User-facing copy uses **smartA.R.S.E.** branding (the default-agent tooltip value).
```

---

## global/domain-data-layer

**Why it applies:** the admin chat-history response and history-item type gain new fields (`chat_context_mode`, `focus_group_session_id`, `focus_group_round_count`, `focus_group_participant_count`, `focus_group_participant_color_tokens`) that must stay consistent with the existing focus-group columns on `chat_results` and the `focus_group_sessions.participants` JSON shape.

```markdown
# Domain model & data layer

## Source of truth

- **Types**: `lib/types.ts` — all entities agents and Supabase schemas should align with.

## When adding fields

1. Update `lib/types.ts` (or the relevant typed module — here `lib/admin-chat-history-types.ts`).
2. Update mock rows + any filters if behavior changes.
3. Plan migration for Supabase columns + RLS.

## Chat / credits

- Credits live on **Project**. No credit-charging changes in this spec.
```

The columns already exist in production (added in the Focus Groups MVP migration). Only the TypeScript types and the admin API selects/grouping change.
