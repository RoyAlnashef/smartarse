# Domain model & data layer

## Source of truth

- **Types**: `lib/types.ts` — all entities agents and Supabase schemas should align with.
- **Mock seed**: `lib/mock-data.ts` — until DB exists, lists mirror production shapes.

## Entities (summary)

| Type | Key fields / notes |
|------|-------------------|
| `User` | `role`, optional `clientId`, `status`, timestamps |
| `Client` | `projectIds`, `userIds`, org-level credits |
| `Project` | `clientId`, `clientName` denorm, `assignedUserIds`, `uploadedFileIds`, credits, `status` live/archived |
| `UploadedFile` | `projectId`, `status` processing/ready/error |
| `Conversation` | `projectId`, nested `messages[]` (client may normalize to separate table later) |
| `ChatMessage` | `role` user/assistant, optional `documentIds` for RAG context |
| `QueryLog` | analytics / credit audit trail |
| `FAQItem` | static content |

## IDs

- String IDs (`u1`, `c1`, `p1`, …) in mock — **replace with UUIDs** in Supabase; keep TypeScript as `string`.

## Relations (mental model)

```
Client 1—* Project *—* UploadedFile
Client 1—* User (client | user roles)
Project *—* assignedUserIds → User
```

## When adding fields

1. Update `lib/types.ts`.
2. Update mock rows + any `getVisibleProjects` / filters if behavior changes.
3. Plan migration for Supabase columns + RLS.

## Chat / credits

- Credits live on **Project** (and summary on **Client** in mock). Server must decrement on AI calls; client display is read-only beyond MVP shell.
