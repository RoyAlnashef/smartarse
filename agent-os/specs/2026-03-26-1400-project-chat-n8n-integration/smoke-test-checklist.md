# Smoke test — project-scoped chat → n8n → history

Run this once per environment (local or staging) after env vars and migrations are applied.

## Prerequisites

- After enabling cookie-based Supabase SSR (`middleware.ts` + `createBrowserClient`), **sign out and sign in once** so the session is stored in cookies (old sessions lived only in `localStorage` and `/api/chat/*` returned 401).
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` set where the app runs (Vercel + local for API routes).
- `NEXT_PUBLIC_N8N_URL` or `NEXT_PUBLIC_N8N_WEBHOOK_URL` points at a workflow that returns JSON within ~85s (or long-run path + `CHAT_N8N_CALLBACK_SECRET` + n8n calling `/api/chat/n8n-complete` per [`disrupt-n8n-coordination.md`](disrupt-n8n-coordination.md)).
- Supabase migrations applied, including [`chat_results` RLS](../../../supabase/migrations/202603311200_chat_results.sql) and [`202604011200_chat_results_cache_index_status_complete.sql`](../../../supabase/migrations/202604011200_chat_results_cache_index_status_complete.sql) if you had a legacy `idx_chat_results_cache` using `completed`.

## Steps

1. **Dashboard (admin)**  
   Sign in as an org admin → create or pick an organization → **Users**: create a **user**-role account in that org (or use an existing one).

2. **Project**  
   **Projects** → create a project under the same org → set status **live** (not paused/archived).

3. **Assignment**  
   Open the project → **Users** tab → assign the **user**-role account to the project (`project_users` row).

4. **Client chat**  
   Sign in as the **user** → `/client/projects` → open the project → send a short question.

5. **Expectations**
   - Assistant reply appears (from n8n JSON `answer` / `output` / `response`).
   - **Chat History** sidebar refreshes and shows the question (from `GET /api/chat/history?project_id=…`).
   - In Supabase **Table Editor** → `chat_results`: newest row has matching `user_id`, `project_id`, `organization_id`, and `request_id` unique.

6. **Thread load (no duplicate query)**  
   Click a **Chat History** row → the main pane shows the saved conversation (user + assistant from `chat_results`) and **does not** fire a new n8n run. Only the clicked row should show a brief loading spinner.

7. **Continue thread (single history row)**  
   With a thread open (from history or after a new question), send a **follow-up** message → sidebar should still show **one** line for that conversation (the anchor row is updated; the ephemeral `request_id` for the job is removed after merge). In Supabase, `result_payload` may include `arse_message_thread` with multiple turns.

8. **Refresh while pending (recovery)**  
   Send a question that takes long enough to show loading, then refresh the page before completion. After the n8n run finishes:
   - The completed turn should still be visible in the same conversation when reopening from **Chat History**.
   - No completed `chat_results` row for that run should be silently skipped in the thread view.
   - Rows with fallback routes (for example `REPORT_FIRST_SQL_FALLBACK`) should still render user query + assistant response.

9. **New chat**  
   Click **New chat** → main pane clears; the next question creates a **new** `chat_results` row (new `request_id`).

10. **Failure hints**
   - Toast about webhook URL → missing `NEXT_PUBLIC_N8N_URL`.
   - Persist fails silently in UI but no history row → check browser Network for `POST /api/chat/persist` (500 often = missing service role key on server).
   - 404 on project or empty history → RLS or user not assigned to project.
   - “Failed to load conversation” on history click → check `GET /api/chat/result` (404 = wrong `request_id` / project / user).
   - Row exists in `chat_results` but thread omits it after refresh → inspect the row for `request_id`, `user_query`, `status`, and `result_payload.answer|output|response`; compare with `/api/chat/result` response and client thread merge logic (anchor row mapping + `arse_message_thread` fallback).
