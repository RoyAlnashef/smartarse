# Per-user project credits — shape

## Scope

- **Attribution:** Show how many credits each user has “spent” (charged) on a given project, derived from persisted chat outcomes.
- **Admin visibility:** Same notion as a **lifetime total per user across all projects** on the dashboard Users table.
- **Billing source of truth:** Postgres-side, idempotent updates tied to terminal `chat_results` rows (not ad hoc decrements in individual API routes).

## Product decisions (locked for v1)

1. **Unit of charge:** **1 credit** per **terminal** user query (`complete` / `error_fallback`). The first completion on a row is billed by the `chat_results` trigger; **follow-ups** merge into the thread anchor (`mergeCompletedJobIntoAnchor`), so each completed follow-up is billed idempotently via `apply_project_credit_for_thread_merge` (see `chat_merge_credit_charges`), incrementing `credits_charged` on the **anchor** row.
2. **Users page metric:** **Lifetime sum** of charged credits for that user **across all projects** (not org-scoped unless later specified).

## Caveat: thread flows and multiple `request_id`s

Follow-up sends use a new ephemeral `request_id` per turn, then merge into the anchor; billing for those turns does **not** rely on a terminal row for that `request_id` (the job row is removed after merge). Idempotency for merge billing is **per `job_request_id`** in `chat_merge_credit_charges`.

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
