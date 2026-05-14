# References — per-user project credits

Repo-root-relative paths unless noted.

## UI

- [`components/projects/project-users.tsx`](../../../components/projects/project-users.tsx) — Members list rows (name, role badge, email, assignment `Switch`).
- [`components/users/user-table.tsx`](../../../components/users/user-table.tsx) — Users table + skeleton column layout.
- [`app/(dashboard)/users/page.tsx`](../../../app/(dashboard)/users/page.tsx) — Users dashboard page.
- [`app/(dashboard)/projects/[id]/page.tsx`](../../../app/(dashboard)/projects/[id]/page.tsx) — Project detail (tabs including Members).
- [`components/dashboard/project-credits-meter.tsx`](../../../components/dashboard/project-credits-meter.tsx) — Bold count + lowercase “spent” / “available” typography.

## Data & types

- [`lib/types.ts`](../../../lib/types.ts) — `Project` / `User` shapes and credit field mapping.
- [`lib/supabase/users.ts`](../../../lib/supabase/users.ts) — `listUsersForDashboard` and related queries.

## Chat persistence & billing touchpoints

- [`supabase/migrations/202603311200_chat_results.sql`](../../../supabase/migrations/202603311200_chat_results.sql) — `chat_results` table, RLS (`chat_results_select_visible`), indexes.
- [`app/api/chat/persist/route.ts`](../../../app/api/chat/persist/route.ts) — Primary persist path for chat results.
- [`app/api/chat/n8n-complete/route.ts`](../../../app/api/chat/n8n-complete/route.ts) — Completion path for long-running n8n workflows.
- [`lib/api/chat-anchor-merge.ts`](../../../lib/api/chat-anchor-merge.ts) — Terminal completion statuses family (`complete`, `error_fallback`, etc.).

## Credits / pause behavior (related migrations)

- [`supabase/migrations/202604091800_projects_auto_pause_balance_only.sql`](../../../supabase/migrations/202604091800_projects_auto_pause_balance_only.sql) — Auto-pause when balance exhausted; charging must remain consistent with `credit_balance`.

## Product context

- [`agent-os/product/roadmap.md`](../../product/roadmap.md) — Credit reporting / analytics roadmap line.

## Visuals in this spec

- [`visuals/project-members-tab-reference.png`](visuals/project-members-tab-reference.png)
- [`visuals/project-card-credits-meter-reference.png`](visuals/project-card-credits-meter-reference.png)
- [`visuals/users-table-reference.png`](visuals/users-table-reference.png)
