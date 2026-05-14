# Handoff — AI / n8n engineer (smartA.R.S.E. project chat)

Send this page plus **[`disrupt-n8n-coordination.md`](disrupt-n8n-coordination.md)** (full contract). The coordination doc is authoritative for payloads and callbacks.

## Webhook URL

- smartA.R.S.E. reads **`NEXT_PUBLIC_N8N_URL`** or **`NEXT_PUBLIC_N8N_WEBHOOK_URL`** (see [`lib/n8n-webhook-url.ts`](../../../lib/n8n-webhook-url.ts)).
- **You** provide the production/staging **Webhook** URL from n8n; the app team pastes it into Vercel / `.env.local`.

## Sync vs async (decide once)

| Path      | When to use                                        | Your work                                                                                                                                                                                                                                                                                    |
| --------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sync**  | Workflow usually finishes in **under ~85 seconds** | Respond **200** with JSON body (see below). Nothing else required.                                                                                                                                                                                                                           |
| **Async** | Can exceed **85s** or unreliable HTTP keep-alive   | App team sets **`CHAT_N8N_CALLBACK_SECRET`** on Next. You add **HTTP Request** node(s) to **`POST {APP_ORIGIN}/api/chat/n8n-complete`** with the shared secret (Bearer or `X-Chat-N8n-Secret`). Optionally call early with `status: "processing"`, then final `complete` / `error_fallback`. |

If async is not wired, the browser will poll **`GET /api/chat/poll`** but **will not** see completion unless a `chat_results` row exists for that `request_id` — so **`n8n-complete` is required** for long jobs.

## Rules (non-negotiable)

1. **Do not** INSERT/UPDATE **`public.chat_results`** from n8n or workers. Next.js **`POST /api/chat/persist`** (and `n8n-complete`) owns writes.
2. **Inbound body** uses **`org_id`** (not `organization_id`). Echo **`request_id`** and **`user_id`** through the workflow for async callbacks.
3. **Outbound JSON:** prefer top-level **`answer`** for the assistant text; **`output`** and **`response`** are accepted as legacy aliases.
4. **Document labels:** the client may send **`project_documents`** (array of `{ id, name, display_name, cite_color_token? }` for ready files). Prefer **`display_name ?? name`** when generating user-facing source strings so they align with the in-app **Sources** list and citation tooltips. Optional **`cite_color_token`** is a Tailwind palette token for UI (and future context); workflows may ignore it until needed.

## Quick test

From curl or n8n “Test” step, return:

```json
{
  "answer": "Smoke test OK",
  "sources": [],
  "status": "complete"
}
```

Then confirm the browser shows the message and a row appears in `chat_results` with `project_id` set.
