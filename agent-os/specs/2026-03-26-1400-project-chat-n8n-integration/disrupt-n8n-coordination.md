# Disrupt / n8n coordination — project chat webhook

Handoff for workflows that serve the smartA.R.S.E. project-detail chat. For a short engineer-facing summary (webhook URL env names, sync vs async), see [`n8n-engineer-handoff.md`](n8n-engineer-handoff.md). **Code reference:** [`lib/api/chat-payload.ts`](../../../lib/api/chat-payload.ts) (`resultPayloadToClientShape`), [`hooks/useChatQuestion.ts`](../../../hooks/useChatQuestion.ts) (request body + timeout → poll).

## 1. Do not write `chat_results` from n8n

- **Policy:** n8n (and any Disrupt worker) must **not** `INSERT`, `UPDATE`, or `DELETE` rows in **`public.chat_results`** in Supabase.
- **Why:** Option B — **Next.js** is the only writer, using the service role in [`POST /api/chat/persist`](../../../app/api/chat/persist/route.ts) (and the optional callback below). That keeps `user_id`, `project_id`, RLS, and idempotency on `request_id` under app control.
- **DB comment:** Migrations document the same rule (`202603311200_chat_results.sql`).

If an existing workflow has a Supabase node targeting `chat_results`, remove or repoint it so completion is either returned in the webhook HTTP response or reported to Next via **`POST /api/chat/n8n-complete`** (see §4).

## 2. Incoming webhook body (smartA.R.S.E. → n8n)

The browser POSTs JSON with at least:

| Field              | Type          | Notes                                                                                                 |
| ------------------ | ------------- | ----------------------------------------------------------------------------------------------------- |
| `chatInput`        | string        | User question (already sanitised client-side).                                                        |
| `org_id`           | string (UUID) | Caller org; **not** `organization_id`.                                                                |
| `user_id`          | string (UUID) | End-user (`users.id`); required for **`POST /api/chat/n8n-complete`** correlation and poll ownership. |
| `request_id`       | string (UUID) | **Idempotency key** — echo in any async callback; must match poll/persist.                            |
| `sessionId`        | string (UUID) | Stable for the project-detail session.                                                                |
| `project_id`       | string (UUID) | Project scope for routing/logging / future RAG.                                                       |
| `weighted`         | boolean       | Org setting.                                                                                          |
| `data_source_mode` | string        | Org setting.                                                                                          |
| `qual_enabled`     | boolean       | Org setting.                                                                                          |
| `thread_anchor_request_id` | string (UUID) | **Optional (Path A).** When the user is continuing a thread, the **`request_id`** of the first `chat_results` row for that conversation. Omit for a brand-new thread. |
| `chatHistory`      | array         | **Optional (Path A).** Prior turns as `{ "role": "user" \| "assistant", "content": string }[]` (plus the current user message). Workflows that ignore this field still run; multi-turn quality improves when the model receives it. |
| `project_documents` | array        | **Optional.** Ready project documents for this turn: `{ "id": string (UUID), "name": string, "display_name": string \| null, "cite_color_token"?: string \| null }[]`. Omitted when the project has no ready documents. Use **`display_name ?? name`** (or `name` only) for human-readable labels in prompts, `sources[]`, and markdown citations. **`cite_color_token`** is a Tailwind palette token from the app allowlist (e.g. `sky-500`); **today** the client uses it for UI alignment between dashboard documents and citations; **later** workflows may echo it into `sources[]` or LLM context — safe to ignore until then. |

URL: from `NEXT_PUBLIC_N8N_URL` or `NEXT_PUBLIC_N8N_WEBHOOK_URL` (see [`lib/n8n-webhook-url.ts`](../../../lib/n8n-webhook-url.ts)).

## 3. Stable response JSON (n8n → smartA.R.S.E.)

The UI and **`POST /api/chat/persist`** accept a **single JSON object** (or, for legacy shapes, the client may unwrap a one-element array — prefer a **top-level object**).

### 3.1 Assistant text (pick one; precedence is fixed in code)

The normaliser treats these as **the same semantic field** (markdown/plain answer), in order:

1. **`answer`** (preferred; matches chat-history-spec)
2. **`response`** (bypass / legacy CSV shape)
3. **`output`** (original developer guide)

If the workflow exposes the final answer under another name, map it in n8n to **`answer`** before responding.

### 3.2 Recommended canonical shape

Use this for new workflows so persist and UI stay aligned:

```json
{
  "answer": "…markdown or plain text…",
  "sources": [],
  "visualizations": [],
  "route": "",
  "tool_calls_used": 0,
  "low_base_warning": false,
  "weighted": false,
  "data_source_mode": "",
  "status": "complete"
}
```

- **`sources`**, **`visualizations`:** arrays (empty array if none). Types are intentionally loose on the client; keep JSON-serialisable items.
- **`route`**, **`tool_calls_used`**, **`low_base_warning`:** optional; defaults apply if omitted.
- **`weighted`**, **`data_source_mode`:** may also be sent at the top level; persist can denormalise from `result` or from body fields.
- **`status`:** use **`complete`** or **`error_fallback`** when the turn is finished. If omitted, the client treats the webhook as **`complete`** for persist.

### 3.3 Sync vs long-running

- **Sync (within ~85s):** Return **200** with the JSON body above. The client will **`POST /api/chat/persist`** with that payload.
- **Long-running (HTTP times out):** The client polls **`GET /api/chat/poll?request_id=<uuid>`**, which reads **`chat_results`** for that `request_id` and the session user. The row must exist and move from **`pending`** / **`processing`** to **`complete`** or **`error_fallback`** without n8n writing the table directly — use **`POST /api/chat/n8n-complete`** (§4), or another **Next-owned** writer agreed with the team.

## 4. Optional async callback — `POST /api/chat/n8n-complete`

When the browser has already submitted `request_id` and started a run, but the answer is not returned inside the webhook timeout, **complete the row from the server** so poll can return **200**.

### 4.1 Authentication

- Set env **`CHAT_N8N_CALLBACK_SECRET`** (shared secret; server-only).
- n8n **HTTP Request** node (or equivalent) must send **one** of:
  - Header **`Authorization: Bearer <CHAT_N8N_CALLBACK_SECRET>`**, or
  - Header **`X-Chat-N8n-Secret: <CHAT_N8N_CALLBACK_SECRET>`**

If the secret is unset, the route responds **503** (disabled).

### 4.2 Request body (JSON)

| Field             | Required | Notes                                                           |
| ----------------- | -------- | --------------------------------------------------------------- |
| `request_id`      | yes      | Same UUID the client sent in the webhook payload.               |
| `user_id`         | yes      | Same end-user as the chat session (`users.id`).                 |
| `organization_id` | yes      | Must match `users.organization_id` for `user_id`.               |
| `project_id`      | no       | If set, must reference a project in the same `organization_id`. |
| `user_query`      | yes      | Same text as `chatInput` for that turn (for audit/history).     |
| `status`          | yes      | `pending`, `processing`, `complete`, or `error_fallback`.       |
| `result`          | no       | Object stored as `result_payload` (use the same keys as §3.2).  |

Optional denormalised columns (same as persist): `weighted`, `data_source_mode`, `system_version`, `is_cacheable`, `cache_hit_count`.

### 4.3 Behaviour

- **Upsert** on `request_id` via service role (same uniqueness rule as persist).
- If a row already exists with a **different** `user_id`, the handler returns **403**.
- Returns **`{ "ok": true }`** on success.

### 4.4 Suggested n8n flow

1. The incoming webhook includes **`user_id`**, **`org_id`** (map to **`organization_id`** in the callback body), **`request_id`**, **`project_id`**, and **`chatInput`** (use the same string as **`user_query`** in the callback). Keep these through the workflow for the completion request.
2. Early in the workflow, optionally call **`n8n-complete`** with `status: "processing"` and `result: {}` so poll stays **202** until the final payload is sent.
3. On success, call **`n8n-complete`** with `status: "complete"` and full **`result`** (see §3.2).

## 5. Checklist

- [ ] Remove Supabase writes to **`chat_results`** from n8n.
- [ ] Return stable JSON with **`answer`** (or **`output`** / **`response`** only if legacy).
- [ ] Include **`sources`** (array) when available.
- [ ] For async runs: configure **`CHAT_N8N_CALLBACK_SECRET`** and **`POST /api/chat/n8n-complete`**; align **`user_id`** for callback body.
- [ ] Confirm **`chat_results`** is the same Supabase project as auth/projects (smartA.R.S.E. migrations + RLS).
