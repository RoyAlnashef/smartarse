# Chat context handoff — `prior_messages` vs `chatHistory`

> **For:** AI / n8n engineer  
> **Issue:** AI agent not retaining prior conversation context on follow-up sends  
> **Likely cause:** Webhook field name mismatch between the legacy n8n contract and the current smartA.R.S.E. app

---

## Short answer

The app **does build and send** prior-turn context on follow-up messages, but it sends it under the field name **`chatHistory`**. The legacy Disrupt/n8n contract expects **`prior_messages`**. If the n8n workflow still reads `prior_messages`, the AI agent will behave as if every turn is stateless — even though the UI and database are retaining the thread correctly.

---

## Three different “histories” (easy to conflate)

| Concept | What it is | Key name |
|--------|------------|----------|
| Sidebar “Chat History” | Paginated list of past threads from `GET /api/chat/history` | UI / `useChatHistory` |
| Stored thread transcript | Multi-turn messages inside `chat_results.result_payload` | `arse_message_thread` |
| Model context on send | Prior turns sent to n8n on follow-ups | **`chatHistory`** (webhook) vs **`prior_messages`** (legacy contract) |

There is **no** `prior_messages` column in Supabase. The database stores threads in `chat_results.result_payload` (via `arse_message_thread`) and controls sidebar visibility with `show_in_chat_history`.

---

## What the app sends today

On a follow-up send, the project page builds transcript context and passes it into `submitQuestion`:

**File:** `app/client/projects/[id]/page.tsx`

```typescript
const prior = messages.filter(
  (m) => m.role === "user" || m.role === "assistant"
)
const chatHistoryForWebhook = [...prior, userMsg].map((m) => ({
  role: m.role,
  content: m.content,
}))
void submitQuestion(content, {
  threadAnchorRequestId: activeThreadRequestId,
  chatHistoryForWebhook: activeThreadRequestId
    ? chatHistoryForWebhook
    : undefined,
  // ...
})
```

`useChatQuestion` maps that internal option to the webhook field **`chatHistory`** (not `prior_messages`):

**File:** `hooks/useChatQuestion.ts`

```typescript
...(anchor ? { thread_anchor_request_id: anchor } : {}),
...(history &&
history.length > 0 &&
!usePersonaMode
  ? { chatHistory: history }
  : {}),
```

The proxy at `/api/n8n` validates and forwards the body **as-is** — no field renaming:

**File:** `app/api/n8n/route.ts`

```typescript
body: JSON.stringify(body),
```

The Zod schema only knows `chatHistory`:

**File:** `lib/n8n-webhook-body-schema.ts`

```typescript
thread_anchor_request_id: z.string().uuid().optional(),
chatHistory: z
  .array(
    z.object({
      role: z.string().max(64),
      content: z.string().max(50_000),
    })
  )
  .max(100)
  .optional(),
```

---

## What n8n / the legacy contract expects

The archived MVP handoff explicitly documents **`prior_messages`**:

**File:** `agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/WEBHOOK-CONTRACT.md`

```typescript
prior_messages?: Array<{        // for threaded follow-ups (P142)
  role: "user" | "assistant";
  content: string;
}>;
```

The old frontend sent exactly that:

**File:** `agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/ChatInterface.tsx`

```typescript
if (!isPersonaMode) {
  const priorMessages = messages
    .filter((m) => m.id !== "welcome" && !m.isRefundNotice)
    .slice(-6) // last 6 messages = up to 3 full turns
    .map((m) => ({ role: m.role, content: m.content.substring(0, 600) }));

  if (priorMessages.length > 0) {
    body.prior_messages = priorMessages;
  }
}
```

The smartA.R.S.E. integration spec deliberately renamed this to `chatHistory` as “Path A”:

**File:** `agent-os/specs/2026-03-26-1400-project-chat-n8n-integration/disrupt-n8n-coordination.md`

| Field | Notes |
|-------|-------|
| `thread_anchor_request_id` | **Optional (Path A).** When the user is continuing a thread, the `request_id` of the first `chat_results` row for that conversation. Omit for a brand-new thread. |
| `chatHistory` | **Optional (Path A).** Prior turns as `{ "role": "user" \| "assistant", "content": string }[]` (plus the current user message). Workflows that ignore this field still run; multi-turn quality improves when the model receives it. |

The rename was intentional on the app side — but **n8n must be updated to match**, or the app must send both keys for backward compatibility.

---

## When context is *not* sent (even if naming were fixed)

These are separate gotchas worth checking:

1. **First message in a new thread** — `chatHistoryForWebhook` is only passed when `activeThreadRequestId` is set. The anchor is set after the first assistant reply completes (`onChatResult` sets it from `meta.jobRequestId`). That’s expected: turn 1 has no prior context.

2. **Persona / custom-audience mode** — `chatHistory` is explicitly omitted when `usePersonaMode` is true (segment or custom audience with a persona brief). Follow-ups in those modes won’t get transcript context unless n8n gets it another way.

3. **“New chat” / persona switch** — `setActiveThreadRequestId(null)` clears the anchor, so the next send starts a fresh thread with no prior context.

4. **No 6-message cap** — the old MVP sliced to the last 6 messages (600 chars each). The new app sends the **full** in-memory thread. That’s a behavior change, but it wouldn’t cause *missing* context — it would send more.

---

## DB side: context *is* being retained

Thread continuation on the app/DB side uses:

- **`arse_message_thread`** inside `result_payload` for ordered multi-turn storage
- **`thread_anchor_request_id`** on persist to merge follow-up turns into the anchor row

Loading from the sidebar hydrates UI state and sets `activeThreadRequestId` (`app/client/projects/[id]/page.tsx` → `loadThreadByRequestId`).

So if the UI shows prior turns after reload but the model “forgets” on the next send, that strongly points to the **webhook field name** (or n8n not wiring `chatHistory` into the agent prompt), not broken DB persistence.

---

## Likely diagnosis

| Symptom | Most likely cause |
|--------|-------------------|
| UI shows full thread; model ignores prior turns | n8n still reads `prior_messages`; app sends `chatHistory` |
| Works for message 2 in-session, breaks after reload + continue | Same — hydration works; webhook field mismatch on send |
| Never works in persona/custom-audience chat | By design today — `chatHistory` is stripped in persona mode |
| Never works even on message 2 in default chat | Check `activeThreadRequestId` is set after first reply |

---

## Recommended fix options

1. **Update n8n** to read `chatHistory` (and optionally `thread_anchor_request_id`) per [`disrupt-n8n-coordination.md`](./disrupt-n8n-coordination.md).

2. **Or** send **both** `chatHistory` and `prior_messages` from the app during a transition period (small code change + schema tweak in `lib/n8n-webhook-body-schema.ts` and `hooks/useChatQuestion.ts`).

3. **Verify** with a logged webhook payload: on a follow-up in default chat, you should see `thread_anchor_request_id` + `chatHistory` populated. If n8n logs show those fields arriving but the agent still forgets, the bug is inside the workflow’s prompt assembly, not the app.

---

## Related docs in this repo

- [`disrupt-n8n-coordination.md`](./disrupt-n8n-coordination.md) — authoritative webhook contract for smartA.R.S.E.
- [`n8n-engineer-handoff.md`](./n8n-engineer-handoff.md) — quick engineer summary
- [`../2026-04-01-1600-chat-history-thread-load-continue/shape.md`](../2026-04-01-1600-chat-history-thread-load-continue/shape.md) — Path A vs Path B threading decisions
