---
name: Stop Chat Hard Cancel
overview: Add a hard-cancel chat stop flow so the send arrow becomes a stop control during loading, and canceled turns can never consume project credits even if async callbacks arrive later.
todos:
  - id: hook-cancel-flow
    content: Extend useChatQuestion with stopQuestion, manual-cancel handling, and cancel API call.
    status: completed
  - id: cancel-api
    content: Create authenticated /api/chat/cancel endpoint to mark pending request cancelled.
    status: completed
  - id: server-guards
    content: Prevent persist/n8n-complete from promoting cancelled rows to terminal billable statuses.
    status: completed
  - id: chat-ui-stop
    content: Swap loading send-arrow to stop button and wire onStop through page + ProjectChat.
    status: completed
  - id: poll-and-smoke-test
    content: Handle cancelled status in poll semantics and run manual no-credit verification.
    status: completed
isProject: false
---

# Hard-cancel stop button (no coin charge)

## What I verified

- The loading arrow lives in [`/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/project-chat.tsx`](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/project-chat.tsx) and is currently disabled while `chatLoading` is true.
- Request lifecycle is driven by [`/Users/royalnashef/Desktop/smart-arse/hooks/useChatQuestion.ts`](/Users/royalnashef/Desktop/smart-arse/hooks/useChatQuestion.ts): it seeds `pending`, calls n8n, and if aborted currently falls back to polling.
- Credits are charged only when `chat_results.status` transitions to `complete`/`error_fallback` via trigger in [`/Users/royalnashef/Desktop/smart-arse/supabase/migrations/202604132000_chat_results_project_credit_charge.sql`](/Users/royalnashef/Desktop/smart-arse/supabase/migrations/202604132000_chat_results_project_credit_charge.sql).

## Implementation plan

- Add cancellable in-flight state in [`/Users/royalnashef/Desktop/smart-arse/hooks/useChatQuestion.ts`](/Users/royalnashef/Desktop/smart-arse/hooks/useChatQuestion.ts):
  - Track active `AbortController`, active `request_id`, and a `userCancelled` flag.
  - Expose `stopQuestion()` from the hook.
  - On manual cancel: abort fetch, skip the timeout/poll fallback path, clear loading without surfacing an error.
- Add server endpoint `POST /api/chat/cancel` in [`/Users/royalnashef/Desktop/smart-arse/app/api/chat/cancel/route.ts`](/Users/royalnashef/Desktop/smart-arse/app/api/chat/cancel/route.ts):
  - Auth with `requireChatSession`.
  - Validate `request_id` + `project_id` ownership.
  - Upsert/update the matching `chat_results` row to `status: "cancelled"` (or `canceled`) and optional cancellation metadata.
- Guard terminal writes after cancellation:
  - Update [`/Users/royalnashef/Desktop/smart-arse/app/api/chat/persist/route.ts`](/Users/royalnashef/Desktop/smart-arse/app/api/chat/persist/route.ts) and [`/Users/royalnashef/Desktop/smart-arse/app/api/chat/n8n-complete/route.ts`](/Users/royalnashef/Desktop/smart-arse/app/api/chat/n8n-complete/route.ts) so if an existing row is cancelled, incoming `complete`/`error_fallback` updates for that `request_id` are ignored (idempotent `ok: true`).
  - This guarantees no terminal status transition, therefore no credit debit.
- Wire UI stop affordance:
  - In [`/Users/royalnashef/Desktop/smart-arse/app/client/projects/[id]/page.tsx`](/Users/royalnashef/Desktop/smart-arse/app/client/projects/[id]/page.tsx), pass `onStop` into `ProjectChat` from `useChatQuestion.stopQuestion`.
  - In [`/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/project-chat.tsx`](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/project-chat.tsx), when `isLoading` show a stop icon/button in place of send arrow and keep it enabled.
- Poll behavior safety:
  - Update [`/Users/royalnashef/Desktop/smart-arse/app/api/chat/poll/route.ts`](/Users/royalnashef/Desktop/smart-arse/app/api/chat/poll/route.ts) to treat cancelled status as non-terminal for UI completion (return `202`), ensuring canceled runs never render assistant output.
- Validation:
  - Manual test: send question → click stop immediately → loading clears, no assistant message, no coin decrement, history row not shown as completed.
  - Manual test: simulate late async callback after cancel → row remains cancelled and project credit balance unchanged.

## n8n coordination needed

- **Required for true “kill query” compute-side behavior:** n8n should support cancellation by `request_id` (or suppress downstream callbacks/work) when stop is triggered.
- **Not required for “no coins” guarantee:** app-side cancellation + terminal-write guards above are sufficient to prevent charges even if n8n finishes later.
