# Smoke test — project-scoped chat → n8n → history

Run this once per environment (local or staging) after env vars and migrations are applied.

## Prerequisites

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

6. **Failure hints**
   - Toast about webhook URL → missing `NEXT_PUBLIC_N8N_URL`.
   - Persist fails silently in UI but no history row → check browser Network for `POST /api/chat/persist` (500 often = missing service role key on server).
   - 404 on project or empty history → RLS or user not assigned to project.
