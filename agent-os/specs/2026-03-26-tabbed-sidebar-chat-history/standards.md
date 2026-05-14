# Standards excerpts — tabbed sidebar + chat history

Pinned copies for offline agent context. Canonical sources live under `agent-os/standards/`; update this file when those docs change materially.

---

## CSS / UI styling

*Source: [`agent-os/standards/css/ui-styling.md`](../../standards/css/ui-styling.md) (full text).*

### Layers

| Layer | Location | Use |
|-------|----------|-----|
| Primitives | `components/ui/*` | shadcn/Radix — buttons, dialogs, forms, tables. |
| Features | `components/<feature>/` | Domain UI: `chat/`, `dashboard/`, `layout/`, `upload/`, `users/`. |

- Compose features from `@/components/ui/*`. Don’t duplicate primitive patterns in feature folders.

### Tokens

- **Semantic (shadcn)**: `background`, `foreground`, `card`, `muted`, `border`, `primary`, `destructive`, `ring` — driven by CSS vars in `app/globals.css`. Prefer these for forms, cards, body text.
- **Brand**: `mint-*` (accent / CTAs / spinners / progress) and `dark-*` (sidebar shell, strong text). Defined in `tailwind.config.ts`.
- **Charts**: `chart.1` … `chart.5` (mint-scale).

### Class patterns

- **`cn()`** from `@/lib/utils` for any conditional/merged Tailwind on custom markup.
- **Focus**: `focus:border-mint-400 focus:ring-2 focus:ring-mint-300/20` on custom inputs (match existing pages).
- **Radius**: `rounded-lg` for controls/cards unless using ui component defaults.

### Icons & fonts

- **Icons**: `lucide-react` only for nav and feature UI.
- **Typography**: `font-sans` (Inter), `font-serif` (DM Serif) for logo/display accents.

### New components

- New primitive → add under `components/ui/` (shadcn-style: forwardRef, `cn`, Radix if needed).
- Product-specific chrome → feature folder; keep shell (`sidebar`, `header`) in `layout/`.

---

## Global / project conventions

*Source: [`agent-os/standards/global/project-conventions.md`](../../standards/global/project-conventions.md) (full text).*

### Imports

- Use **`@/`** alias for `app/`, `components/`, `lib/` — no deep relative `../../../` across those roots.

```ts
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
```

### Class merging

- **`cn(...inputs)`** — `clsx` + `tailwind-merge`. Use for `className` on wrappers; ui primitives already use it internally.

### Client vs server

- **`"use client"`** only where hooks, browser APIs, or event handlers are required.
- Prefer Server Components for static content when introducing RSC-friendly pages; current dashboard is mostly client for auth.

### Toasts & theme

- **Toasts**: `sonner` (`Toaster` in tree) for ephemeral feedback — prefer over raw `alert`.
- **Theme**: `next-themes` + `ThemeProvider` if dark mode is enabled; globals use light tokens by default.

### File naming

- Components: **PascalCase** (`ProjectCard.tsx`).
- Utilities / types: **kebab-case** files in `lib/` (`mock-data.ts`, `auth-context.tsx`).

### Product naming in code

- User-facing copy and storage keys should use **smartA.R.S.E.** branding over legacy app names when touched.

---

## Developer guide — org settings & chat API routes

*Source: [`agent-os/standards/global/developer-guide.md`](../../standards/global/developer-guide.md) (excerpts).*

### Org settings (relevant to chat payload)

- **GET** `<VERCEL_API_BASE_URL>/api/org/settings` with Supabase session — or direct Supabase `organizations` row.
- Response fields used in chat: `use_weighted`, `data_source_mode`, `qual_enabled`, `show_source_filter` (see full guide for table).

### Webhook payload (include `org_id`)

- Chat POST body includes **`org_id`** (from `users.organization_id`), plus `chatInput`, `request_id`, `sessionId`, and org settings fields as documented in the guide.
- **Timeout:** guide suggests ~85s then poll.

### Poll + claim (history integration)

- **GET** `/api/chat/poll?request_id=<uuid>` — poll until `status` is `complete` or `error`; result shape matches webhook response.
- **POST** `/api/chat/claim` — body `{ request_id }`; fire-and-forget after a successful result (associate with user / history).

### Route table (chat-related)

All routes require a valid Supabase session cookie or Authorization header.

| Route | Method | Purpose |
|-------|--------|---------|
| /api/org/settings | GET | Org config (use_weighted, data_source_mode, qual_enabled) |
| /api/chat/history | GET | Past questions for this user |
| /api/chat/poll?request_id=\<uuid\> | GET | Poll for pending chat result |
| /api/chat/claim | POST | Associate chat result with user |

*For response shapes, error codes, pagination, and UI hooks, prefer [`agent-os/product/dev-notes/chat-history-spec.md`](../../product/dev-notes/chat-history-spec.md) where it extends or narrows this guide.*
