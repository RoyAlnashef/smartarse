# References — Persona drawer in client chat

## Similar implementations (this repo)

### Client project detail chat (integration point)

- **Location:** `components/client/project-detail/project-chat.tsx`
- **Relevance:** Magenta-bordered chat shell, message bubbles, input/send — drawer must live **inside** this section.
- **Key patterns:** `cn`, `arse-*` tokens, client typography (`font-arse-body` / `font-arse-title`).

### Client project detail page

- **Location:** `app/client/projects/[id]/page.tsx`
- **Relevance:** Renders `ProjectChat` with messages state; page grid already gives lateral room for chat + sidebar.

### Tabs primitive

- **Location:** `components/ui/tabs.tsx`
- **Relevance:** Radix `Tabs` for Segments / Audience / Focus Group; override `className` for pill/ARSE styling.

### Admin project chat (out of scope but analogous)

- **Location:** `app/(dashboard)/projects/[id]/page.tsx`, `components/chat/chat-window.tsx`
- **Relevance:** Multi-column chat layouts elsewhere; **do not** merge admin UI into client route — only mental model for flex columns.

## External reference

- **Tailwind Plus — Drawers:** [Application UI / Overlays / Drawers](https://tailwindcss.com/plus/ui-blocks/application-ui/overlays/drawers) — layout and close-control patterns (paid/licensed markup if copied verbatim).

## Types and mock data (future)

- **Today:** UI mocks colocated with drawer component.
- **Later:** `lib/types.ts` persona/segment entities, `lib/mock-data.ts` or API — see `agent-os/standards/global/domain-data-layer.md`.
