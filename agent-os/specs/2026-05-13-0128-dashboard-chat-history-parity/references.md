# References for Dashboard Chat History Parity

Pointers to the in-app code we mirror.

## Client-app sources we mirror

### Client chat history card — tooltip + focus-group line item

- **Location:** [components/client/project-detail/chat-history-card.tsx](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/chat-history-card.tsx)
- **Relevance:** the `HistoryTooltipBody` helper (lines 62–79) and the focus-group rendering branch (lines 224–352) are the visual contracts we port to `components/chat/chat-sidebar.tsx`.
- **Key patterns:** two-line tooltip with uppercase tracked label + body value, dot-stack pattern for ≥2 participants, single-dot fallback for 1 participant, accent text on hover/active.

### Client history grouping — server-side

- **Location:** [lib/api/chat-history-server.ts](/Users/royalnashef/Desktop/smart-arse/lib/api/chat-history-server.ts) (look for `buildHistoryResponse` + the focus-group session grouping branch).
- **Relevance:** ported algorithm for `lib/api/admin-chat-history-server.ts`: group rows by `focus_group_session_id`, keep newest `created_at`, preserve the initial topic, surface participant color tokens from the session snapshot, fall back to `participantIndices.size` for in-flight rounds.

### Client history API — session join

- **Location:** [app/api/chat/history/route.ts](/Users/royalnashef/Desktop/smart-arse/app/api/chat/history/route.ts)
- **Relevance:** template for how `app/api/admin/projects/[id]/chat-history/route.ts` should select the new focus-group columns and `focus_group_sessions(id, participants)` and pass them into the response builder.

### Client focus-group session endpoint

- **Location:** [app/api/focus-group/sessions/[id]/route.ts](/Users/royalnashef/Desktop/smart-arse/app/api/focus-group/sessions/[id]/route.ts)
- **Relevance:** authoritative `{ session, participants, rounds }` shape. The new admin endpoint at `app/api/admin/projects/[id]/focus-group-session/route.ts` mirrors this near-verbatim — reuse `parseParticipants`, `resultPayloadToClientShape`, the `status in ('complete','error_fallback')` filter, and the per-round `RoundDto`/`RoundResponseDto` shape — but auth via `requireDashboardAdmin` and verify `focus_group_sessions.project_id` matches the route `:id`.

### Client transcript components — light-theme adaptation source

- **Location:** [components/client/project-detail/project-chat.tsx](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/project-chat.tsx) (`FocusGroupRoundTopicBubble`, `FocusGroupResponseBubble`, `FocusGroupTranscriptRound`)
- **Relevance:** structural template for the new `components/chat/admin-focus-group-transcript.tsx`. Keep the round-topic-as-user-bubble + per-participant assistant bubbles + persona color accent pattern, but render against the dashboard's white surface + `border-border` tokens.

## Dashboard sources we modify

### Dashboard chat sidebar

- **Location:** [components/chat/chat-sidebar.tsx](/Users/royalnashef/Desktop/smart-arse/components/chat/chat-sidebar.tsx)
- **Relevance:** target component for the tooltip refactor + focus-group row rendering. `ChatSidebarConversationMeta` is extended with the new focus-group fields and a `chatContextMode` discriminator.

### Dashboard chat window

- **Location:** [components/chat/chat-window.tsx](/Users/royalnashef/Desktop/smart-arse/components/chat/chat-window.tsx)
- **Relevance:** receives optional `focusGroupSession` + `focusGroupRounds` props and switches to the new admin transcript renderer when present.

### Dashboard project page

- **Location:** [app/(dashboard)/projects/[id]/page.tsx](</Users/royalnashef/Desktop/smart-arse/app/(dashboard)/projects/[id]/page.tsx>)
- **Relevance:** forwards the new meta fields to the sidebar, branches `handleAdminHistorySelect` on `chat_context_mode === 'focus_group'`, and wires the new transcript props into `ChatWindow`.

### Admin history API + response builder

- **Location:** [app/api/admin/projects/[id]/chat-history/route.ts](</Users/royalnashef/Desktop/smart-arse/app/api/admin/projects/[id]/chat-history/route.ts>), [lib/api/admin-chat-history-server.ts](/Users/royalnashef/Desktop/smart-arse/lib/api/admin-chat-history-server.ts)
- **Relevance:** the entry points that get extended to select focus-group columns, join `focus_group_sessions`, and group rows by session.

### Admin single-result loader (untouched but referenced)

- **Location:** [app/api/admin/projects/[id]/chat-result/route.ts](</Users/royalnashef/Desktop/smart-arse/app/api/admin/projects/[id]/chat-result/route.ts>), [lib/admin-project-chat-result.ts](/Users/royalnashef/Desktop/smart-arse/lib/admin-project-chat-result.ts)
- **Relevance:** still used for non-focus-group rows. The new `lib/admin-project-focus-group-session.ts` is the parallel helper for focus-group rows.

## Related prior specs

### Focus Groups MVP — origin of the client-side parity we're mirroring

- **Location:** [agent-os/specs/2026-05-12-2305-focus-groups-mvp/](/Users/royalnashef/Desktop/smart-arse/agent-os/specs/2026-05-12-2305-focus-groups-mvp/)
- **Relevance:** end-to-end source of the chat-history grouping logic and the tooltip/transcript designs we now port to the dashboard.

### Admin project chat history — original dashboard spec

- **Location:** [agent-os/specs/2026-04-09-0937-admin-project-chat-history/](/Users/royalnashef/Desktop/smart-arse/agent-os/specs/2026-04-09-0937-admin-project-chat-history/)
- **Relevance:** original wiring of the admin chat history feature this spec extends.
