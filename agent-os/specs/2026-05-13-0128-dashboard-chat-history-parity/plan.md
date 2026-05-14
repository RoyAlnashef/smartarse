---
name: dashboard chat parity
overview: 'Bring the dashboard''s chat sidebar + chat window to parity with the client app for tooltips and focus-group sessions: tooltips switch to a two-line "Label: Value" format on every row, multiple focus-group rounds collapse into a single sidebar entry, and clicking that entry hydrates the full session into one chat thread using a light-themed focus-group transcript.'
todos:
  - id: t1
    content: Save spec documentation under agent-os/specs/2026-05-13-0128-dashboard-chat-history-parity/ (plan.md, shape.md, standards.md, references.md, visuals/ with the provided screenshot).
    status: in_progress
  - id: t2
    content: "Extend lib/admin-chat-history-types.ts: add chat_context_mode, focus_group_session_id, focus_group_round_count, focus_group_participant_count, focus_group_participant_color_tokens to AdminChatHistoryItem. Mirror the optional shape used in lib/chat-history-types.ts."
    status: pending
  - id: t3
    content: "Update lib/api/admin-chat-history-server.ts: extend AdminChatHistorySourceRow with chat_context_mode, focus_group_session_id, focus_group_round_number, focus_group_participant_index; accept an optional focusGroupSessions map; group rounds with the same focus_group_session_id into one AdminChatHistoryItem (newest created_at, initial topic, participant color tokens from session.participants, participantIndices count fallback) — same algorithm as buildHistoryResponse in lib/api/chat-history-server.ts."
    status: pending
  - id: t4
    content: "Update app/api/admin/projects/[id]/chat-history/route.ts: select the new columns from chat_results; for any unique focus_group_session_id, fetch focus_group_sessions(id, participants) via adminClient; pass focusGroupSessions to buildAdminHistoryResponse. Keep RLS‑friendly admin client usage."
    status: pending
  - id: t5
    content: "Add new endpoint app/api/admin/projects/[id]/focus-group-session/route.ts: GET by session_id query param. Auth via requireDashboardAdmin, validate that focus_group_sessions.project_id matches the route :id, then return { session, participants, rounds } using the exact same shape as app/api/focus-group/sessions/[id]/route.ts. Reuse parseParticipants + resultPayloadToClientShape; filter chat_results status in ('complete','error_fallback')."
    status: pending
  - id: t6
    content: Add a small client helper lib/admin-project-focus-group-session.ts that fetches the new endpoint and returns the typed { session, participants, rounds } payload (parallel to lib/admin-project-chat-result.ts).
    status: pending
  - id: t7
    content: "Update components/chat/chat-sidebar.tsx: (a) extend ChatSidebarConversationMeta with chatContextMode, focusGroupSessionId, focusGroupRoundCount, focusGroupParticipantCount, focusGroupParticipantColorTokens; (b) introduce a shared HistoryTooltipBody component (label/value two-line layout, ported from chat-history-card.tsx) and use it for every row — 'Agent: smartA.R.S.E.' for default LLM rows, 'Segment: …', 'Audience: …', 'Focus group: N participants · M rounds'; (c) render focus-group rows with the dot-stack pattern (or single dot when 1 participant token), preserving the existing user label + date metadata."
    status: pending
  - id: t8
    content: "Update app/(dashboard)/projects/[id]/page.tsx adminSidebarMeta useMemo to forward the new focus-group fields. Add focus-group state (focusGroupSession, focusGroupRounds, focusGroupLoading) for the admin pane. In handleAdminHistorySelect, branch on item.chat_context_mode === 'focus_group': call the new helper, store session+rounds, and clear adminMessages; standard rows continue to use chatMessagesFromStoredResult."
    status: pending
  - id: t9
    content: "Build light-themed focus-group transcript components for the dashboard at components/chat/admin-focus-group-transcript.tsx: AdminFocusGroupRoundTopicBubble (user-style bubble matching MessageBubble's user side), AdminFocusGroupResponseBubble (assistant-style bubble with persona color accent + label), AdminFocusGroupTranscriptRound. Keep visual structure identical to FocusGroupTranscriptRound in project-chat.tsx but using dashboard tokens (white surface, border-border, persona color tokens for accents)."
    status: pending
  - id: t10
    content: Update components/chat/chat-window.tsx to optionally accept focusGroupSession + focusGroupRounds props (mutually exclusive with messages). When present, render AdminFocusGroupTranscriptRound[] inside the same scroll container instead of MessageBubble[]. Preserve loading/empty states (ChatWindowAdminReadOnlyEmpty, ChatWindowLoadingState).
    status: pending
  - id: t11
    content: Wire the new ChatWindow props in app/(dashboard)/projects/[id]/page.tsx so a selected focus-group entry renders the full transcript; non-focus-group selections continue to pass messages as before.
    status: pending
  - id: t12
    content: "Run pnpm tsc --noEmit; fix any introduced lint/type errors. (USER CHECKPOINT) admin manually opens a project that has a focus-group session and verifies: (1) sidebar shows one collapsed row per session, (2) tooltips on every row follow LABEL: VALUE, (3) clicking the focus-group row loads the full multi-round transcript in the chat window."
    status: pending
isProject: false
---

# Dashboard Chat History Parity

## Goal

Reflect the client-app's improved chat-history UX onto the dashboard project workspace without touching the visible metadata (user label, date, count rules). Two outcomes:

1. **Tooltips on every chat-history row** use a uniform two-line `LABEL: VALUE` format that mirrors `HistoryTooltipBody` from [components/client/project-detail/chat-history-card.tsx](components/client/project-detail/chat-history-card.tsx).
2. **Focus-group sessions collapse into one row** in the sidebar and into a **single chat thread** in the chat window — same as the client app.

The dashboard remains light-themed; we'll build a light-themed variant of the client app's round-based focus-group transcript.

## Current state (where parity is missing)

- Sidebar tooltip in [components/chat/chat-sidebar.tsx](components/chat/chat-sidebar.tsx) is single-line, only shown when there is a segment/audience name; default LLM rows have no tooltip.
- [app/api/admin/projects/[id]/chat-history/route.ts](app/api/admin/projects/[id]/chat-history/route.ts) + [lib/api/admin-chat-history-server.ts](lib/api/admin-chat-history-server.ts) don't select focus-group columns and don't group session rounds — each round currently shows up as its own line item.
- [components/chat/chat-window.tsx](components/chat/chat-window.tsx) only renders flat `ChatMessage[]` via `MessageBubble`; it has no focus-group transcript shape.
- Admin selection in [app/(dashboard)/projects/[id]/page.tsx](<app/(dashboard)/projects/[id]/page.tsx>) loads one row at a time via `getAdminProjectChatResult` — no way to hydrate a whole focus-group session.

## Data flow after the change

```mermaid
flowchart TD
  Sidebar[chat-sidebar.tsx]
  Window[chat-window.tsx]
  Page["app/(dashboard)/projects/[id]/page.tsx"]
  HistAPI["GET /api/admin/projects/[id]/chat-history"]
  ResAPI["GET /api/admin/projects/[id]/chat-result"]
  FGAPI["NEW: GET /api/admin/projects/[id]/focus-group-session"]
  DB[(chat_results + focus_group_sessions)]

  Sidebar -->|render rows + tooltips| Page
  Page -->|fetch list| HistAPI
  HistAPI -->|group focus-group rounds<br/>+ join sessions| DB

  Page -->|standard row click| ResAPI
  Page -->|focus-group row click| FGAPI
  FGAPI --> DB
  Page --> Window
  Window -->|MessageBubble<br/>or FG transcript| Page
```

## Reference implementations to mirror

- [lib/api/chat-history-server.ts](lib/api/chat-history-server.ts) — already groups focus-group rounds per `focus_group_session_id`; we port the same grouping logic into `admin-chat-history-server.ts`.
- [app/api/focus-group/sessions/[id]/route.ts](app/api/focus-group/sessions/[id]/route.ts) — provides the session+rounds shape; we'll write a near-clone scoped by `project_id` and auth'd via `requireDashboardAdmin`.
- [components/client/project-detail/chat-history-card.tsx](components/client/project-detail/chat-history-card.tsx) lines 62-79 (`HistoryTooltipBody`) and the focus-group branch around lines 224-352 — pattern for tooltip body + dot stack.
- [components/client/project-detail/project-chat.tsx](components/client/project-detail/project-chat.tsx) `FocusGroupRoundTopicBubble` / `FocusGroupResponseBubble` / `FocusGroupTranscriptRound` — light-theme variants for admin.

## Tooltip contract (every row gets a tooltip)

- Default LLM row → `Agent: smartA.R.S.E.`
- Persona segment row → `Segment: <persona_segment_name>`
- Custom audience row → `Audience: <custom_audience_name>`
- Focus group row → `Focus group: N participants · M rounds`

Metadata under the title (user label, date, dot/dot-stack) stays as-is.

## Out of scope

- Visible metadata changes (user label, date, message counts).
- Theming changes on the dashboard outside the chat window's focus-group transcript.
- Client-app changes (already shipped).

## Validation

- `pnpm tsc --noEmit` clean.
- Manual UI smoke: open a project as admin where the client has run a focus group → sidebar shows 1 row per session with tooltip "Focus group: N participants · M rounds"; clicking it renders the full multi-round transcript inside the chat window; other rows show their new `LABEL: VALUE` tooltip.
