# Tabbed sidebar + chat history — shaping notes

## Scope

- **Client** project detail (`/client/projects/[id]`): the **right column** becomes a **tabbed shell** with **Chat History**, **Personas**, and **Studio** instead of a personas-only column with collapse-to-rail.
- **Chat history** follows the product spec: data contracts, pagination, session id, refresh rules, webhook payload shape (**JSON key `org_id`**), sanitise-before-POST, fire-and-forget claim, polling behaviour — see linked spec below.
- **Implementation** spans UI shell first, then API routes, lib, hooks, and full history UI per phased plan in [`plan.md`](plan.md).

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Default tab | **Chat History** (`defaultValue="chat-history"`). |
| Mobile | **Same three tabs** as desktop — one shared inner component inside the existing slide-over drawer. |
| Right-column collapse | **Removed** for this phase (no narrow rail / chevron expand); single stable `lg` grid ratio. |
| Personas tab | **`PersonaPanel`** without **`onCollapseToRail`** so the collapse chevron does not appear. |
| Studio tab | Placeholder / empty state until product defines content. |

## Product spec (source of truth for data & behaviour)

- **[`agent-os/product/dev-notes/chat-history-spec.md`](../../product/dev-notes/chat-history-spec.md)** — `HistoryResponse`, components (`ChatHistorySidebar`, `HistoryGroup`, `HistoryItem`, skeletons), hooks (`useChatHistory`, `useRerunQuestion`), lib helpers, pagination, session id (`useRef(crypto.randomUUID())`), refresh rules, webhook payload and **80** poll attempts (where the spec differs from older guide copy).

## Context

- **Visuals:** [`visuals/`](visuals/) — three screenshots copied from Cursor project assets (line tabs / sidebar references).
- **References:** [`references.md`](references.md).
- **Standards:** [`standards.md`](standards.md).

## API note

- [`agent-os/standards/global/developer-guide.md`](../../standards/global/developer-guide.md) documents `/api/chat/history`, `/api/chat/poll`, `/api/chat/claim`, and `/api/org/settings`. Routes may need to be **added or verified** in the Next.js app against Supabase — see plan checklist.
