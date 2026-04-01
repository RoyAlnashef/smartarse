# Standards — thread hydration, transcript, `chat_results`

Work in this spec must follow the global domain and data-layer rules below, plus the merge and migration notes specific to multi-turn transcripts.

---

## global/domain-data-layer

Full source: [`agent-os/standards/global/domain-data-layer.md`](../../standards/global/domain-data-layer.md).

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

- Mocks may use string IDs; **Supabase uses UUIDs**; TypeScript stays `string`. **`request_id`** on `chat_results` is the stable identifier for a stored job/row; **thread anchor** reuses the first row’s `request_id` when merging follow-ups.

### When adding fields (including transcript storage)

1. Update `lib/types.ts` and any API contracts (e.g. `lib/chat-history-types.ts`, payload normalizers).
2. Update mocks or filters if client-visible behaviour changes.
3. **Prefer** embedding an ordered **`messages[]`** (or equivalent) inside **`result_payload`** first.
4. If the product later needs query/index support on messages, add a dedicated **`jsonb`** column via migration and RLS review — do not skip the usual migration + policy pass.

### Chat / credits (product note)

- Credits live on **Project** (and org summary in mock). **This spec does not implement credit consume**; server-side decrement remains a separate concern.

---

## RLS and server writes (unchanged intent)

- **`user_id`** and **`project_id`** on `chat_results` must be validated from the **authenticated session** and project membership — not from untrusted client-only assertions.
- **Merge / upsert** paths (`persist`, optional `n8n-complete`) should remain **idempotent** and avoid orphan duplicate rows for the same logical thread; see [`plan.md`](plan.md) merge notes.

---

## Project conventions

- Use the **`@/`** alias for `app/`, `components/`, `lib/`.
- **`"use client"`** only where hooks or browser APIs are required; prefer server routes for secrets and service role.

See [`agent-os/standards/global/project-conventions.md`](../../standards/global/project-conventions.md) for full detail.
