# Chat history thread load + continue — shaping notes

## Scope

- **Hydrate from history:** Selecting a sidebar row loads the stored `chat_results` row (by `request_id`) and fills the main chat timeline with the saved user + assistant content — **no** n8n webhook, **no** new row for that click.
- **Continue in thread:** While an “active thread” (anchor `request_id`) is selected, new sends still use a **new** `request_id` for async polling, but persistence **merges** the new turn into the anchor row so the sidebar does not show a second headline for the same conversation line.
- **Data model (initial):** Prefer an ordered `messages[]` inside `result_payload` to avoid an immediate migration; promote to a dedicated `jsonb` column later if query/index needs arise (see [`standards.md`](standards.md)).

## Decisions

| Topic | Choice |
| ----- | ------ |
| **Path A vs B** | **Path B** is the structural default for app-only delivery (hydration + merge without requiring n8n changes first). **Path A** is the recommended follow-up: extend the webhook body with `thread_anchor_request_id` (or equivalent) plus **prior messages** / transcript so the model sees full context. Document Path A in n8n handoff docs when implementing. |
| **History list identity** | Expose **`request_id`** on each history item; use it for hydration keys and fetches. Prefer **`request_id` as React key** over hashed numeric `id` to avoid collisions. |
| **Deduping** | **Do not** dedupe history by trimmed `user_query` for project chat — each `chat_results` row is a distinct thread head. Keep pagination caps (e.g. page size, max pages). |
| **Legacy rows** | Until multi-turn data exists, a row may represent a **single** Q/A pair; hydration still shows that pair consistently. |

## Contradiction with legacy product spec

[`agent-os/product/dev-notes/chat-history-spec.md`](../../product/dev-notes/chat-history-spec.md) states (Overview, HistoryItem click behaviour):

- Clicking a question **re-submits** it through the n8n webhook and shows the result in the main window.
- It also says history is **auto-deduplicated server-side** and items use **`onRerun(user_query)`** semantics.

**This spec supersedes those behaviours for the client project detail chat:**

- Click = **load stored thread** (GET result by `request_id`), not rerun.
- Server history for this surface = **one row per thread head**, not dedupe-by-text.
- Admin or other surfaces that intentionally “rerun” the same prompt may keep separate UX; call that out if those routes/components still exist.

## Screenshot reference

Product/context visual (project chat + history sidebar):

- **File:** [`visuals/chat-history-thread-reference.png`](visuals/chat-history-thread-reference.png)  
- **Source asset (plan):** `image-6ac77106-8c4a-4ba9-a006-b6c65eefaff3.png` (copied from Cursor project assets into this folder for version control).

## Related specs

- **[`../2026-03-26-1400-project-chat-n8n-integration/`](../2026-03-26-1400-project-chat-n8n-integration/)** — persistence, poll, n8n-complete, webhook baseline.
- **Product:** [`mission.md`](../../product/mission.md), [`summary_chat_result_rows.md`](../../product/data-examples/summary_chat_result_rows.md).

## Context in this folder

- **Plan / tasks:** [`plan.md`](plan.md).
- **Standards:** [`standards.md`](standards.md).
- **References:** [`references.md`](references.md).
- **Visuals:** [`visuals/`](visuals/).
