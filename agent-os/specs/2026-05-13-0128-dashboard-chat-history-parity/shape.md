# Dashboard Chat History Parity — Shaping Notes

## Scope

Reflect the client-app's improved chat-history UX onto the dashboard's project workspace, without touching visible metadata (user label, date, message counts). Two outcomes:

1. **Tooltips on every chat-history row** use a uniform two-line `LABEL: VALUE` format that mirrors `HistoryTooltipBody` from [components/client/project-detail/chat-history-card.tsx](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/chat-history-card.tsx).
2. **Focus-group sessions collapse into one row** in the sidebar and into a **single chat thread** in the chat window — same as the client app.

The dashboard remains light-themed; we'll build a light-themed variant of the client app's round-based focus-group transcript.

## Decisions

- **Tooltip contract = mirror client labels exactly**
  - Default LLM → `Agent: smartA.R.S.E.`
  - Persona segment → `Segment: <persona_segment_name>`
  - Custom audience → `Audience: <custom_audience_name>`
  - Focus group → `Focus group: N participants · M rounds`
- **Focus-group transcript styling = light-themed variant** of the client app's `FocusGroupTranscriptRound` / `FocusGroupResponseBubble` / `FocusGroupRoundTopicBubble`. The chat-window white surface is preserved; persona color tokens drive the per-participant accents.
- **Grouping = server-side**, in `lib/api/admin-chat-history-server.ts`, ported from `lib/api/chat-history-server.ts` (newest `created_at`, initial topic, participant color tokens from `focus_group_sessions.participants`, participant-index fallback for in-flight rounds).
- **Session hydration = new admin endpoint** `/api/admin/projects/[id]/focus-group-session` mirroring the client `/api/focus-group/sessions/[id]` shape, but auth'd via `requireDashboardAdmin` and project-scoped by route id.
- **Metadata not touched** — user label, date, dot/dot-stack remain visible. We're only adding/standardizing tooltips and collapsing focus-group sessions.

## Context

- **Visuals:** `visuals/01-current-dashboard-chat-history.png` — the user's screenshot showing the current dashboard chat history (separate rows per focus-group round, single-line audience tooltip on "AM TEST"). This is the baseline we're upgrading.
- **References:** see [references.md](./references.md). Primary mirror is the client-app's already-shipped chat-history card and `/api/chat/history` grouping path.
- **Product alignment:** N/A — pure UX parity. No new domain entities.

## Standards Applied

- `css/ui-styling` — tooltip body + focus-group transcript bubbles reuse existing `components/ui/tooltip` and `MessageBubble` patterns and the persona color tokens. No new primitives.
- `global/project-conventions` — `@/` imports, `cn` for className merging, kebab-case file names for new helpers, PascalCase components.

## Out of Scope

- Visible metadata changes (user label, date, message count rules).
- Theming changes to the dashboard outside the focus-group transcript bubbles.
- Client-app chat history changes (already shipped).
- Editing/sending new chats from the admin pane — admin view stays read-only as today.
