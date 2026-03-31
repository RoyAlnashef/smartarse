# References — project chat + n8n integration

## Disrupt / n8n handoff

| Resource | Role |
| -------- | ---- |
| [`disrupt-n8n-coordination.md`](disrupt-n8n-coordination.md) | Stable webhook JSON (`answer` / `output` / `response`, `sources`), **no n8n writes to `chat_results`**, optional **`POST /api/chat/n8n-complete`** for async + poll. |
| [`n8n-engineer-handoff.md`](n8n-engineer-handoff.md) | Short TL;DR for the n8n engineer: webhook env names, sync vs async, link to full coordination doc. |
| [`smoke-test-checklist.md`](smoke-test-checklist.md) | Manual QA: admin → assign user → chat → verify `chat_results.project_id`. |

## Product & data contracts

| Resource | Role |
| -------- | ---- |
| [`agent-os/product/dev-notes/chat-history-spec.md`](../../product/dev-notes/chat-history-spec.md) | History API shape, pagination, session id, sanitise, poll/claim semantics, webhook **`org_id`**, component and hook names. |
| [`agent-os/product/dev-notes/original-developer-guidelines.md`](../../product/dev-notes/original-developer-guidelines.md) | Legacy route names and integration notes; map **`claim`** → **`persist`** as in [`plan.md`](plan.md). |
| [`agent-os/product/data-examples/summary_chat_result_rows.md`](../../product/data-examples/summary_chat_result_rows.md) | Target **`chat_results`** column semantics, `result_payload`, flags, bypass `response` field. |
| [`agent-os/product/data-examples/chat_results_rows.csv`](../../product/data-examples/chat_results_rows.csv) | Sample row export for contract alignment. |
| [`agent-os/product/mission.md`](../../product/mission.md) | Product direction: project-centric chat, Disrupt coordination. |
| [`agent-os/product/roadmap.md`](../../product/roadmap.md) | Sequencing context. |
| [`agent-os/product/tech-stack.md`](../../product/tech-stack.md) | Env naming (`NEXT_PUBLIC_N8N_URL`, webhooks). |

## Prior / adjacent specs

| Spec folder | Role |
| ----------- | ---- |
| [`../2026-03-26-tabbed-sidebar-chat-history/`](../2026-03-26-tabbed-sidebar-chat-history/) | Tabbed sidebar UI checklist and chat history UX. |
| [`../2026-03-17-1545-client-project-detail/`](../2026-03-17-1545-client-project-detail/) | Original project detail layout and chat shell. |

## Implementation files (touchpoints)

| File | Role |
| ---- | ---- |
| [`app/client/projects/[id]/page.tsx`](../../../app/client/projects/[id]/page.tsx) | Project detail page; wire hooks, `sessionId`, live history, refresh after send. |
| [`components/client/project-detail/project-chat.tsx`](../../../components/client/project-detail/project-chat.tsx) | Chat UI; send / loading / errors. |
| [`components/client/project-detail/project-right-sidebar.tsx`](../../../components/client/project-detail/project-right-sidebar.tsx) | Right column; pass API-backed history into list. |
| [`components/chat/chat-history-mock-list.tsx`](../../../components/chat/chat-history-mock-list.tsx) | History list (rename later); consume real items + pagination. |
| [`components/chat/history-item.tsx`](../../../components/chat/history-item.tsx), [`history-group.tsx`](../../../components/chat/history-group.tsx) | Row and grouping UI. |
| [`lib/group-by-date.ts`](../../../lib/group-by-date.ts) | Group history by date; align with spec. |
| [`lib/chat-history-types.ts`](../../../lib/chat-history-types.ts), [`lib/types.ts`](../../../lib/types.ts) | Types for API + webhook normalization. |
| [`app/api/chat/history/route.ts`](../../../app/api/chat/history/route.ts), [`poll/route.ts`](../../../app/api/chat/poll/route.ts), [`persist/route.ts`](../../../app/api/chat/persist/route.ts), [`n8n-complete/route.ts`](../../../app/api/chat/n8n-complete/route.ts) | Chat history, poll (reads `chat_results`), persist (user session), optional n8n completion callback (shared secret). |

## Database

| File | Role |
| ---- | ---- |
| [`supabase/migrations/202603241900_projects_project_users_rls.sql`](../../../supabase/migrations/202603241900_projects_project_users_rls.sql) | Pattern for org + `project_users` visibility; model `chat_results` RLS after this. |
| [`supabase/migrations/202603311200_chat_results.sql`](../../../supabase/migrations/202603311200_chat_results.sql) | `chat_results` table + RLS select policy. |
| [`supabase/migrations/202604011200_chat_results_cache_index_status_complete.sql`](../../../supabase/migrations/202604011200_chat_results_cache_index_status_complete.sql) | Fix legacy cache index using `completed` → app vocabulary **`complete`**. |
