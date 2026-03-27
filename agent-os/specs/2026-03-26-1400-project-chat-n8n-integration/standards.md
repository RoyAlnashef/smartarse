# Standards — project chat, `chat_results`, RLS

The following standards apply to migrations, API routes, and client integration for this work.

---

## global/domain-data-layer

Excerpt from [`agent-os/standards/global/domain-data-layer.md`](../../standards/global/domain-data-layer.md).

### Source of truth

- **Types:** `lib/types.ts` — entities and Supabase-aligned shapes should stay in sync.
- **Mock seed:** `lib/mock-data.ts` — until fully DB-backed, lists mirror production shapes where used.

### Entities (summary)

| Type | Key fields / notes |
| ---- | ------------------ |
| `User` | `role`, optional `organization_id`, `status`, timestamps |
| `Organization` | `projectIds`, `userIds`, org-level credits |
| `Project` | `organization_id`, denorm names, `assignedUserIds`, uploads, credits, `status` |
| `Conversation` | `projectId`, nested `messages[]` (client may normalize to separate table later) |
| `ChatMessage` | `role` user/assistant, optional `documentIds` for RAG context |
| `QueryLog` | analytics / credit audit trail |

### IDs

- Mocks may use string IDs; **Supabase uses UUIDs**; TypeScript stays `string`.

### When adding fields (including `chat_results`)

1. Update `lib/types.ts` (and any `lib/chat-history-types.ts` contracts).
2. Update mocks or filters if behaviour visible to the client changes.
3. Ship a **migration** for new columns, indexes, and **RLS** — do not rely on the browser or n8n for authoritative writes to `chat_results`.

### Chat / credits (product note)

- Credits live on **Project** (and org summary in mock). **This spec does not implement credit consume**; server-side decrement remains a separate concern.

---

## RLS patterns (projects + `project_users`)

New **`chat_results`** policies should align with how project visibility is enforced today.

**Reference migration:** [`supabase/migrations/202603241900_projects_project_users_rls.sql`](../../../supabase/migrations/202603241900_projects_project_users_rls.sql).

### Mental model (from that migration)

- **Dashboard admin** (`public.is_dashboard_admin()`) can see broader rows where product requires it.
- **Client** role: access tied to **`users.organization_id`** matching **`projects.organization_id`**.
- **User** role: access via **`project_users`** join — user must be assigned to the project and share the same org as the project.

### Applying the pattern to `chat_results`

- **SELECT:** Allow when `organization_id` matches the viewer’s org **and** either `project_id` is **null** (legacy/orphan) **or** the viewer may see that project (client for org, or user in `project_users`, per existing project rules).
- **INSERT/UPDATE from clients:** Avoid broad `authenticated` insert; prefer **Next.js route handlers** using the **service role** for upserts (`persist`), with **session-validated** `project_id` and `user_id`.
- **Poll / pending rows:** If the server creates pending rows, same org/project visibility rules should apply; completion updates stay server-side.

---

## Auth & security (cross-cutting)

- **Never** expose the Supabase **service role** key to the browser.
- Validate **`project_id`** on every persist/history request: project exists, belongs to the user’s organization, and the user is allowed to access that project (mirror RLS intent in application code).
- **`user_id`** on persisted rows must come from the **authenticated session**, not from n8n or untrusted client body fields alone.

---

## Project conventions (imports)

- Use the **`@/`** alias for `app/`, `components/`, `lib/`.
- **`"use client"`** only where hooks or browser APIs are required; prefer server routes for secrets and service role.

See [`agent-os/standards/global/project-conventions.md`](../../standards/global/project-conventions.md) for full detail.
