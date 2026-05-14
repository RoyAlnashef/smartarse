# References — handover survey citations (Phase 1)

## This spec

| Resource | Role |
| -------- | ---- |
| [`plan.md`](plan.md) | End-to-end tasks: types, parsing, thread persistence, `Q_CODE_QUESTIONS`, per-occurrence `[n]` hrefs, tooltip UI, verification. |
| [`shape.md`](shape.md) | Scope, hybrid question copy, persistence caveat, product alignment. |
| [`standards.md`](standards.md) | Embedded excerpts from global standards for types, payload, and UI. |
| [`visuals/README.md`](visuals/README.md) | Optional QA screenshots. |

## Handover archive (Disrupt MVP frontend)

| Resource | Role |
| -------- | ---- |
| [`agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/CitationChip.tsx`](../../product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/CitationChip.tsx) | `Source.question_codes[]`, inline citation chips, tooltip wiring. |
| [`agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/MarkdownResponse.tsx`](../../product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/MarkdownResponse.tsx) | `marker_position`, `consumeInline` / marker consumption notes for aligning `[n]` with `inline_citations`. |

## Current smart-arse implementation

| File | Role |
| ---- | ---- |
| [`lib/types.ts`](../../../lib/types.ts) | `ChatCitationSource`, `ChatMessage`, and future `ChatInlineCitation` definitions. |
| [`lib/api/chat-payload.ts`](../../../lib/api/chat-payload.ts) | `parseCitationSource`, `resultPayloadToClientShape`, n8n snake_case aliases. |
| [`lib/chat-thread.ts`](../../../lib/chat-thread.ts) | `ThreadStoredMessage`, `mergeJobIntoAnchorPayload`, `chatMessagesFromStoredResult`, `threadMessagesForPayload`. |
| [`lib/chat/citation-tooltip.tsx`](../../../lib/chat/citation-tooltip.tsx) | Survey (and other) citation tooltip body. |
| [`components/chat/chat-citation-sources-footer.tsx`](../../../components/chat/chat-citation-sources-footer.tsx) | Sources footer; retained in Phase 1. |
| [`components/client/project-detail/project-chat.tsx`](../../../components/client/project-detail/project-chat.tsx) | `rewriteInlineCitationMarkers`, `citationIndexFromHref`. |
| [`components/chat/message-bubble.tsx`](../../../components/chat/message-bubble.tsx) | Markdown `a` handler for `citation://` links. |

## Product and standards index

| Resource | Role |
| -------- | ---- |
| [`agent-os/product/mission.md`](../../product/mission.md) | MVP: Disrupt RAG, auditable chat. |
| [`agent-os/standards/index.yml`](../../standards/index.yml) | Registry of global standards. |
