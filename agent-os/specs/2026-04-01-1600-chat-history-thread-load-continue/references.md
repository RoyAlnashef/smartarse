# References — chat history thread load + continue

## This spec

| Resource | Role |
| -------- | ---- |
| [`plan.md`](plan.md) | Problem, target behaviour, task checklist, sequence diagram. |
| [`shape.md`](shape.md) | Scope, Path A/B, contradiction with legacy chat-history-spec, screenshot pointer. |
| [`standards.md`](standards.md) | Embedded domain-data-layer + transcript/migration discipline. |
| [`visuals/chat-history-thread-reference.png`](visuals/chat-history-thread-reference.png) | UI/context reference (copied from plan asset). |

## Parent integration spec

| Resource | Role |
| -------- | ---- |
| [`../2026-03-26-1400-project-chat-n8n-integration/plan.md`](../2026-03-26-1400-project-chat-n8n-integration/plan.md) | Option B persistence, poll, routes. |
| [`../2026-03-26-1400-project-chat-n8n-integration/disrupt-n8n-coordination.md`](../2026-03-26-1400-project-chat-n8n-integration/disrupt-n8n-coordination.md) | Webhook JSON; extend with Path A fields when n8n is ready. |
| [`../2026-03-26-1400-project-chat-n8n-integration/n8n-engineer-handoff.md`](../2026-03-26-1400-project-chat-n8n-integration/n8n-engineer-handoff.md) | Short TL;DR for n8n engineers. |
| [`../2026-03-26-1400-project-chat-n8n-integration/smoke-test-checklist.md`](../2026-03-26-1400-project-chat-n8n-integration/smoke-test-checklist.md) | Manual QA; extend for history hydration + merge. |

## Product and legacy spec (superseded behaviours)

| Resource | Role |
| -------- | ---- |
| [`agent-os/product/dev-notes/chat-history-spec.md`](../../product/dev-notes/chat-history-spec.md) | Original “click = rerun webhook” and dedupe rules — **client project page** behaviour is superseded by this spec; see [`shape.md`](shape.md). |
| [`agent-os/product/data-examples/summary_chat_result_rows.md`](../../product/data-examples/summary_chat_result_rows.md) | `chat_results` / `result_payload` semantics. |
| [`agent-os/product/mission.md`](../../product/mission.md) | Auditable, project-scoped chat. |

## Implementation touchpoints

| File | Role |
| ---- | ---- |
| [`lib/api/chat-payload.ts`](../../../lib/api/chat-payload.ts) | Normalize `result_payload` → UI text (`answer`, nested shapes). |
| [`lib/api/chat-history-server.ts`](../../../lib/api/chat-history-server.ts) | History mapping; stop stripping `request_id`; dedupe policy. |
| [`lib/chat-history-types.ts`](../../../lib/chat-history-types.ts) | `HistoryItem` + API contracts. |
| [`lib/chat-history.ts`](../../../lib/chat-history.ts) | Client fetch helper pattern for history. |
| [`app/api/chat/history/route.ts`](../../../app/api/chat/history/route.ts) | History endpoint. |
| [`app/api/chat/persist/route.ts`](../../../app/api/chat/persist/route.ts) | Persist + future merge into anchor. |
| [`app/api/chat/poll/route.ts`](../../../app/api/chat/poll/route.ts) | Poll by `request_id`. |
| [`app/api/chat/n8n-complete/route.ts`](../../../app/api/chat/n8n-complete/route.ts) | Completion writes; reconcile with merge strategy. |
| [`hooks/useChatQuestion.ts`](../../../hooks/useChatQuestion.ts) | Send, poll, persist; optional anchor + Path A payload. |
| [`components/client/project-detail/chat-history-card.tsx`](../../../components/client/project-detail/chat-history-card.tsx) | History list; pass full item / `request_id`. |
| [`app/client/projects/[id]/page.tsx`](../../../app/client/projects/[id]/page.tsx) | Active thread state, hydration, send behaviour. |
| [`lib/api/require-chat-session.ts`](../../../lib/api/require-chat-session.ts) | Auth for new result route. |

## Database

| File | Role |
| ---- | ---- |
| [`supabase/migrations/202603311200_chat_results.sql`](../../../supabase/migrations/202603311200_chat_results.sql) | `chat_results` table baseline. |
