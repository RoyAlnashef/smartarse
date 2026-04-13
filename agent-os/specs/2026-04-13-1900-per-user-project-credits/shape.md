# Per-user project credits — shape

## Scope

- **Attribution:** Show how many credits each user has “spent” (charged) on a given project, derived from persisted chat outcomes.
- **Admin visibility:** Same notion as a **lifetime total per user across all projects** on the dashboard Users table.
- **Billing source of truth:** Postgres-side, idempotent updates tied to terminal `chat_results` rows (not ad hoc decrements in individual API routes).

Out of scope for this shape (v1): merge-aware billing across multiple `request_id`s for a single logical turn; separate junction/counter tables beyond `chat_results` aggregates.

## Product decisions (locked for v1)

1. **Unit of charge:** **1 credit** per **terminal** chat outcome per **`request_id`** (see billable states in `plan.md`).
2. **Users page metric:** **Lifetime sum** of charged credits for that user **across all projects** (not org-scoped unless later specified).

## Caveat: thread flows and multiple `request_id`s

Some thread flows may persist **more than one** `chat_results` row for what feels like one user “turn” (for example distinct rows for an anchor step and a follow-on job). Idempotency is **per row / per `request_id`**, so multiple terminal rows can each incur one credit. That is an accepted v1 tradeoff; a future iteration can introduce merge-aware or thread-level billing if product wants stricter alignment with conversational turns.

## Visuals (durable copies)

Files live in `visuals/` (copied from Cursor workspace assets used during shaping):

| File | What it shows |
| ---- | --------------- |
| [`visuals/project-members-tab-reference.png`](visuals/project-members-tab-reference.png) | Project **Members** tab: org users with toggles; **gap** in each row where per-user “spent” should align with project-level meter styling. |
| [`visuals/project-card-credits-meter-reference.png`](visuals/project-card-credits-meter-reference.png) | Project card **69 available – 123 spent** pattern (bold numerals, lowercase labels) to mirror on member rows. |
| [`visuals/users-table-reference.png`](visuals/users-table-reference.png) | Dashboard **Users** table before a dedicated credits column; new column intended **between Last Login and Status**. |

Additional cross-spec reference (existing dashboard asset): [`../2026-03-24-1600-projects-supabase-dashboard/visuals/project-card-credits-current.png`](../2026-03-24-1600-projects-supabase-dashboard/visuals/project-card-credits-current.png).

## Standards applied

See [`standards.md`](standards.md) (domain/data layer + project conventions).
