# References for Personas right column

## Prior spec (superseded on desktop)

### Persona drawer in client chat

- **Location:** [`../2026-03-18-1400-persona-drawer-chat/`](../2026-03-18-1400-persona-drawer-chat/)
- **Relevance:** Original in-chat drawer, mock segments, tabs, apply flow, and visuals.
- **Key patterns to reuse:** `MOCK_SEGMENT_PERSONAS`, Radix `Tabs`, applied-persona detail card, pinned chat alerts (stay in `ProjectChat`).

## Implementation files

| File | Role |
|------|------|
| [`app/client/projects/[id]/page.tsx`](../../../app/client/projects/[id]/page.tsx) | Project detail layout; will own 3-col grid + shared persona state. |
| [`components/client/project-detail/project-chat.tsx`](../../../components/client/project-detail/project-chat.tsx) | Messages + composer; drawer logic to remove on desktop. |
| [`components/client/project-detail/persona-drawer.tsx`](../../../components/client/project-detail/persona-drawer.tsx) | Personas header, tabs, mock list — refactor for column + optional mobile close. |

## Related product / client detail

- [`../2026-03-17-1545-client-project-detail/`](../2026-03-17-1545-client-project-detail/) — earlier client project detail layout shaping.
