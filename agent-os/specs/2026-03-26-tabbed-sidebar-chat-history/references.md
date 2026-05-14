# References — tabbed sidebar + chat history

## Prior spec (personas right column)

- **Location:** [`../2026-03-19-1000-personas-right-column/`](../2026-03-19-1000-personas-right-column/)
- **Relevance:** Earlier 3-column layout, `PersonasColumn`, collapse rail, and `PersonaPanel` integration — this feature **replaces** collapse with tabs and adds Chat History / Studio.
- **Useful artifacts:** `shape.md`, `standards.md`, `visuals/` for before/after context.

## Product spec

| Resource | Role |
|----------|------|
| [`agent-os/product/dev-notes/chat-history-spec.md`](../../product/dev-notes/chat-history-spec.md) | Data contracts, components, hooks, lib, pagination, refresh, webhook **`org_id`**, polling/claim behaviour. |

## Implementation files (current / planned touchpoints)

| File | Role |
|------|------|
| [`app/client/projects/[id]/page.tsx`](../../../app/client/projects/[id]/page.tsx) | Grid layout; persona state; will pass `orgId`, `sessionId`, org settings, history refresh. |
| [`components/client/project-detail/personas-column.tsx`](../../../components/client/project-detail/personas-column.tsx) | Today: collapse rail + `PersonaPanel`; may be removed or reduced to a re-export when tabbed shell lands. |
| [`components/client/project-detail/persona-drawer.tsx`](../../../components/client/project-detail/persona-drawer.tsx) | `PersonaPanel`, `EmptyPane`, inner pill `Tabs` — patterns to mirror for empty states; `onCollapseToRail` optional. |
| [`components/client/project-detail/mobile-persona-drawer.tsx`](../../../components/client/project-detail/mobile-persona-drawer.tsx) | Mobile slide-over; should host the **same** tabbed inner component as desktop. |
| [`components/client/project-detail/project-chat.tsx`](../../../components/client/project-detail/project-chat.tsx) | Mobile trigger for the panel; label/aria should reflect **Chat History default** / general panel scope. |
| [`components/ui/tabs.tsx`](../../../components/ui/tabs.tsx) | Add **`variant="line"`** on `TabsList` for top-level sidebar tabs; keep **default** variant for `PersonaPanel` inner tabs. |

## Planned additions (per plan)

- `components/chat/` — `ChatHistorySidebar`, `HistoryGroup`, `HistoryItem`, `HistoryItemSkeleton` (or documented colocation elsewhere).
- `lib/chat-history.ts`, `lib/sanitise.ts`, `lib/group-by-date.ts`
- `hooks/useChatHistory.ts`, `hooks/useRerunQuestion.ts`
- `app/api/chat/history`, `poll`, `claim` (and alignment with existing `org/settings` if any)

## Visuals in this spec

- [`visuals/image-21014ce8-e4cb-470a-8a84-6550bfd18022.png`](visuals/image-21014ce8-e4cb-470a-8a84-6550bfd18022.png)
- [`visuals/image-f4902d63-80e9-4880-8586-f766d0fb881d.png`](visuals/image-f4902d63-80e9-4880-8586-f766d0fb881d.png)
- [`visuals/image-de3e7f7b-3e6f-4388-b9d8-6b06be14d659.png`](visuals/image-de3e7f7b-3e6f-4388-b9d8-6b06be14d659.png)

*Copied from Cursor project assets: `.cursor/projects/Users-royalnashef-Desktop-smart-arse/assets/` (same filenames).*
