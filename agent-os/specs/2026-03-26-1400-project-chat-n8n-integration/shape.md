# Project-scoped chat + n8n — shaping notes

## Scope

- **End-to-end project chat:** Wire the client project detail chat to **real** history, webhook send, optional poll, and **server-side persistence** of completed turns — not mock-only state.
- **Project association:** Each persisted row ties to **`project_id`** (and session **`user_id`**) so history in the right sidebar is **scoped to the open project** when `project_id` is present.
- **APIs to add in the Next.js app:** `GET /api/chat/history`, `GET /api/chat/poll`, `POST /api/chat/persist` (or legacy-named `/claim`), aligned with [`chat-history-spec.md`](../../product/dev-notes/chat-history-spec.md) plus the **Option B** persistence rules below.
- **Supabase:** Introduce or extend **`chat_results`** (including `project_id`), indexes, and RLS consistent with org membership and `project_users`.

## Decisions (locked)

| Decision | Choice |
| -------- | ------ |
| Who writes `chat_results` | **Next.js** (service role in a trusted route), not n8n. |
| n8n role | Return AI JSON only; may receive `project_id` for routing/logging; **must not** insert/update `chat_results`. |
| Post-answer persistence | Client calls **`POST /api/chat/persist`** after a complete answer (sync response or after poll); idempotent on `request_id` where possible; fire-and-forget acceptable. |
| Poll source of truth | **State maintained by Next** (or a Disrupt callback into Next), not “whatever n8n wrote to the DB”. |
| History filtering | **`GET /api/chat/history?project_id=`** limits rows to that project for the project detail tab; validate org + `project_users` server-side. |
| Webhook payload | Extend documented body with **`project_id`**; keep **`org_id`** key naming per existing spec. |
| Response field names | Client normalizes **`answer`**, **`output`**, **`response`** (and related flags) into one internal shape for persist + UI. |

## Out of scope (this phase)

- **Credits:** balance display changes, consume/decrement on send.
- **Persona mode:** persona-specific webhook fields and UI integration (keep current persona shell; do not expand persona payloads here).
- **Document-scoped RAG in webhook:** optional follow-up — only if Disrupt workflows support selected document IDs.

## Related specs

- **[`../2026-03-26-tabbed-sidebar-chat-history/`](../2026-03-26-tabbed-sidebar-chat-history/)** — tabbed shell, Chat History UI checklist; this spec owns **backend + persistence + n8n contract** depth.
- **Product:** [`mission.md`](../../product/mission.md), [`roadmap.md`](../../product/roadmap.md).

## Context in this folder

- **Plan / tasks:** [`plan.md`](plan.md).
- **Disrupt / n8n:** [`disrupt-n8n-coordination.md`](disrupt-n8n-coordination.md) — webhook JSON, no DB writes from n8n, optional `n8n-complete` callback.
- **Standards:** [`standards.md`](standards.md).
- **References:** [`references.md`](references.md).
- **Visuals:** [`visuals/`](visuals/) — placeholder only for this spec.
