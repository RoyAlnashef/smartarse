# Per-user project credits (shape-spec + implementation plan)

Spec copy saved under `agent-os/specs/2026-04-13-1900-per-user-project-credits/` (2026-04-13). Implementation status: **not started** in this folder; treat `shape.md` and `references.md` as the durable entry points.

## Product alignment

Roadmap already calls out “Credit consumption reporting and analytics” ([`agent-os/product/roadmap.md`](../../product/roadmap.md)). This iteration delivers **attribution** (who spent what on which project) and **admin visibility** on two existing surfaces, using these decisions: **1 credit per terminal chat outcome per `request_id`**, and **Users page = lifetime sum across all projects**.

## Current codebase facts

- **Project totals:** [`lib/types.ts`](../../../lib/types.ts) maps `Project.totalCredits` → `projects.credit_balance` and `usedCredits` → `projects.used_credits`. UI uses [`components/dashboard/project-credits-meter.tsx`](../../../components/dashboard/project-credits-meter.tsx) (bold number + lowercase “spent” / “available” — reuse this typography for member rows).
- **Members UI:** [`components/projects/project-users.tsx`](../../../components/projects/project-users.tsx) renders each row as name/badge + email (flex) and a `Switch` on the right — good place to insert a middle “spent” block matching the Members reference screenshot in `visuals/`.
- **Users UI:** [`components/users/user-table.tsx`](../../../components/users/user-table.tsx) + [`app/(dashboard)/users/page.tsx`](../../../app/(dashboard)/users/page.tsx) load via [`lib/supabase/users.ts`](../../../lib/supabase/users.ts) (`listUsersForDashboard`). Add a column (preference: between **Last Login** and **Status**); update [`UserTableSkeleton`](../../../components/users/user-table.tsx) column counts to match.
- **Chat persistence:** [`app/api/chat/persist/route.ts`](../../../app/api/chat/persist/route.ts) and [`app/api/chat/n8n-complete/route.ts`](../../../app/api/chat/n8n-complete/route.ts) upsert [`chat_results`](../../../supabase/migrations/202603311200_chat_results.sql) but **do not** touch credits today — charging should live in **Postgres** (trigger or `SECURITY DEFINER` RPC) so both paths and any retries stay consistent and idempotent.

## Data model and charging rule

1. **Billable states:** Treat `status in ('complete', 'error_fallback')` as terminal (same family as existing merge completion paths in [`lib/api/chat-anchor-merge.ts`](../../../lib/api/chat-anchor-merge.ts)).
2. **Scope:** Only when `project_id` and `user_id` are non-null (ignore legacy org-only rows).
3. **Idempotency:** Add a durable marker on `chat_results` (e.g. `credit_charged_at timestamptz null` or `credits_charged integer not null default 0` with `check (credits_charged in (0,1))`). On transition into a billable state, **at most one** charge: increment `projects.used_credits` by 1, decrement `projects.credit_balance` by 1 (clamp at 0 to respect `credit_balance >= 0`), set the marker, `updated_at` on `projects` as needed. Repeated upserts with the same terminal status must not charge again.
4. **Per-user read model:** For a given `project_id`, aggregate `sum(credits_charged)` grouped by `user_id` from `chat_results` (no extra junction counters table for v1). For the Users page, `sum(credits_charged)` grouped by `user_id` across all projects.
5. **Known caveat (also in `shape.md`):** Thread flows that persist **separate** `chat_results` rows per `request_id` may accrue **multiple** credits for one logical “turn” (anchor + job). Acceptable for v1 given idempotency is per `request_id`; refine later with merge-aware billing if needed.

## RLS and access

- **Dashboard admins** already bypass broader constraints in several flows; confirm `chat_results` [`chat_results_select_visible`](../../../supabase/migrations/202603311200_chat_results.sql) allows admins to `select` rows needed for aggregates (it includes `is_dashboard_admin()`).
- If any aggregate query is awkward under RLS, prefer a thin **`SECURITY DEFINER` read RPC** (e.g. `dashboard_project_credit_spend_by_user(p_project_id uuid)`) that checks `is_dashboard_admin()` and returns `(user_id, credits_spent)` — keeps the browser client simple and matches patterns used elsewhere (e.g. credit RPCs in migrations).

## Application / types

- Extend [`User`](../../../lib/types.ts) with an optional or required numeric field, e.g. `creditsSpentLifetime`, populated in [`lib/supabase/users.ts`](../../../lib/supabase/users.ts) (either a second query + merge, or a Postgres view / RPC returning users with totals — pick one; RPC/view avoids N+1).
- For the Members tab, pass a `Map<userId, number>` (or merge into `User` only for that screen) from [`app/(dashboard)/projects/[id]/page.tsx`](../../../app/(dashboard)/projects/[id]/page.tsx) into [`ProjectUsers`](../../../components/projects/project-users.tsx) props — fetch when `useRemoteDetail` and project id are known, same loading patterns as the rest of the page.

## Styling

- Reuse meter semantics from [`project-credits-meter.tsx`](../../../components/dashboard/project-credits-meter.tsx): **bold count**, lowercase muted “spent” label, optional small `Coins`/existing credits icon for consistency with the project card reference ([`agent-os/specs/2026-03-24-1600-projects-supabase-dashboard/visuals/project-card-credits-current.png`](../2026-03-24-1600-projects-supabase-dashboard/visuals/project-card-credits-current.png)).

## Standards (for Task 1 `standards.md`)

From [`agent-os/standards/index.yml`](../../standards/index.yml), `standards.md` in this folder includes full text of:

- [`agent-os/standards/global/domain-data-layer.md`](../../standards/global/domain-data-layer.md) — entity shapes, Supabase mapping.
- [`agent-os/standards/global/project-conventions.md`](../../standards/global/project-conventions.md) — client boundaries, imports, UI patterns.

(No `api/response-format` in this repo’s index.)

## Task 1 (shape-spec): Save spec documentation

This folder contains:

| File            | Purpose                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `plan.md`       | This plan (repo-relative links; implementation tracked outside this file)                                                               |
| `shape.md`      | Scope, decisions, caveat on thread `request_id`s, visuals list                                                                            |
| `standards.md`  | Pasted content of the two standards files above                                                                                           |
| `references.md` | Links to primary code and migration touchpoints                                                                                           |
| `visuals/`      | Reference screenshots (copied from Cursor project `assets/`; see `shape.md` for filenames)                                              |

## Implementation tasks (after Task 1)

2. **Migration:** `chat_results` billing marker + trigger (or RPC + trigger) updating `projects.used_credits` / `credit_balance` idempotently; comments explaining pause still follows `credit_balance` ([`202604091800_projects_auto_pause_balance_only.sql`](../../../supabase/migrations/202604091800_projects_auto_pause_balance_only.sql)).
3. **Read path:** RPC or documented query for (a) per-project per-user sums, (b) per-user lifetime sums for `listUsersForDashboard`.
4. **UI — Members:** Update [`components/projects/project-users.tsx`](../../../components/projects/project-users.tsx) + project page data loading.
5. **UI — Users:** Update [`components/users/user-table.tsx`](../../../components/users/user-table.tsx), skeleton, and [`lib/supabase/users.ts`](../../../lib/supabase/users.ts) / types.
6. **Verification:** Local Supabase — complete a project chat, confirm row marker, project counters, both UIs; confirm duplicate upsert does not double-charge.
