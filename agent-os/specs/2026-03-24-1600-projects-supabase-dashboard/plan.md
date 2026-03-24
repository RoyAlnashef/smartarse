# Plan: Projects table (Supabase) + dashboard wiring

## Task 1: Save spec documentation (complete)

Created `agent-os/specs/2026-03-24-1600-projects-supabase-dashboard/` with:

| File | Purpose |
|------|---------|
| `plan.md` | This plan |
| `shape.md` | Scope, decisions, product alignment |
| `standards.md` | Applicable Agent OS standards (full text) |
| `references.md` | Code references and prior specs |
| `visuals/README.md` | Placeholder for future mockups |

---

## ✅ Task 2: Database schema + migration — **DONE**

**Delivered:** [`supabase/migrations/202603241800_projects_project_users.sql`](../../../supabase/migrations/202603241800_projects_project_users.sql)  
**Apply (local / linked project):** `supabase db push` from repo root, or run the SQL in the Supabase SQL editor / your migration pipeline. *(CLI dry-run was not linked in this environment.)*  
**Verified:** Tables created in Supabase using this migration (confirmed after apply).

- [x] Add `public.projects` with (minimum): `id` (uuid, PK), `organization_id` (uuid, FK → `organizations.id`, not null), `name`, `description`, `status` (`live` \| `archived`), **`used_credits` only** (`integer`, default `0`, ≥ 0; no `total_credits`), `created_at`, `updated_at`, and `last_activity` (nullable `timestamptz`).
- [x] Add `public.project_users` with `project_id`, `user_id` (FKs with `on delete cascade`), composite primary key `(project_id, user_id)`, and index on `user_id` for list-by-user queries.
- [x] Naming aligned with existing tables (`snake_case`, `uuid` ids). Table/column comments document used-credits-only and RLS follow-up.
- [x] Documented apply steps above. **RLS is not enabled in this migration** — complete **Task 3** before exposing these tables to clients in production.

---

## ✅ Task 3: RLS + constraints — **DONE**

**Delivered:** [`supabase/migrations/202603241900_projects_project_users_rls.sql`](../../../supabase/migrations/202603241900_projects_project_users_rls.sql)  
**Follow-up (recursion fix):** [`supabase/migrations/202603251200_fix_projects_rls_recursion.sql`](../../../supabase/migrations/202603251200_fix_projects_rls_recursion.sql) — replaces cross-table `SELECT` policies with `auth_user_can_read_project(uuid)` (**SECURITY DEFINER**) so PostgREST `insert…returning` does not hit “infinite recursion detected in policy for relation projects”. Apply after the Task 3 migration.  
**Apply:** Run this SQL in Supabase (SQL editor or `supabase db push` after the Task 2 migration).  
**Verified:** RLS migration applied in Supabase (confirmed).

- [x] Enable RLS on `projects` and `project_users`.
- [x] **Admin:** full select/insert/update/delete via `public.is_dashboard_admin()` (same helper as organizations/users).
- [x] **Client:** `select` on `projects` when `role = 'client'`, `status = 'active'`, and `organization_id` matches the project’s org.
- [x] **User:** `select` on `projects` when `role = 'user'`, assigned in `project_users`, **and** `users.organization_id = projects.organization_id` (blocks cross-org rows even if mis-inserted).
- [x] **`project_users`:** `select` for admin; clients see rows for projects in their org; users see rows for projects they’re assigned to (same org); **insert/update/delete** admin-only (extend later if clients manage members).
- [x] **`projects_active_requires_organization`** added to match `202603240010_active_requires_organization.sql` (immediate validation; satisfied while `organization_id` is `NOT NULL`).

---

## ✅ Task 4: TypeScript data layer — **DONE**

**Delivered:** [`lib/supabase/projects.ts`](../../../lib/supabase/projects.ts) · JSDoc on `Project` in [`lib/types.ts`](../../../lib/types.ts)  
**Also:** [`supabase/migrations/202603242010_organizations_select_own_org.sql`](../../../supabase/migrations/202603242010_organizations_select_own_org.sql) — lets non-admin members **select** their org row so PostgREST can embed `organizations(name, credit_balance)` on project queries (apply in Supabase alongside app code).

- [x] Row types + `rowToProject`: `clientId` ← `organization_id`, `clientName` / `totalCredits` ← embedded `organizations`, `usedCredits` ← `used_credits`, `lastActivity` from `last_activity` → `updated_at` → `created_at`, `uploadedFileIds: []`.
- [x] `assignedUserIds` via batched `project_users` query (list + single).
- [x] `listProjectsForAuthUser()`, `getProjectById()`, `createProject()`, `updateProject()` using `getSupabaseBrowserClient()` (same pattern as `organizations.ts`).
- [x] `lib/types.ts` JSDoc for Supabase-backed fields on `Project`.

---

## ✅ Task 5: Dashboard project cards — credits used UI — **DONE**

**Delivered:** [`components/dashboard/project-card.tsx`](../../../components/dashboard/project-card.tsx)

- [x] Footer shows **“{n} credit(s) used”** instead of credits left; **no** % label or progress bar (simplified follow-up).
- [x] Coins icon uses **`text-mint-500`**, aligned with dashboard project detail badge.
- [x] Project detail badge copy: **“credits used”** (replaces “credits spent”).
- [x] **`creditsUsedLabel`** helper retained; removed percent/bar helpers.
- [x] Before screenshot: `visuals/project-card-credits-current.png`.

---

## ✅ Task 6: Wire dashboard projects list — **DONE**

**Delivered:** [`components/dashboard/projects-workspace.tsx`](../../../components/dashboard/projects-workspace.tsx) · [`components/dashboard/project-card.tsx`](../../../components/dashboard/project-card.tsx) (`ProjectCardSkeleton` uses [`Skeleton`](https://ui.shadcn.com/docs/components/radix/skeleton)) · [`components/dashboard/project-create-dialog.tsx`](../../../components/dashboard/project-create-dialog.tsx)

- [x] Load projects via `listProjectsForAuthUser()` when Supabase + session; fall back to `getVisibleProjects()` mock when Supabase is not configured.
- [x] **Loading:** grid of **`ProjectCardSkeleton`** (shadcn `Skeleton`) while remote list is fetching; **errors:** `toast.error`.
- [x] Filters + `ProjectCard` unchanged for consumers.
- [x] Admin **Add Project** → dialog (org select + name + description) → `createProject` → toast + refetch list.

---

## ✅ Task 7: Wire dashboard project detail — **DONE**

**Delivered:** `app/(dashboard)/projects/[id]/page.tsx`, `components/dashboard/project-detail-skeleton.tsx`, `components/projects/project-users.tsx`

- [x] Resolve project with **`getProjectById(id)`** when Supabase + session; otherwise **`mockProjects`**.
- [x] **`ProjectDetailSkeleton`** while loading; **not found / no access** when `null` or missing mock id (message + **Back to projects**).
- [x] **Chat / documents** still use mock files + conversations.
- [x] **Members:** **`listUsersForDashboard()`** for admins (org-scoped list in UI) + **`project.assignedUserIds`** from **`project_users`** via `getProjectById`; `ProjectUsers` syncs when `assignedUserIds` changes.

---

## Task 8: Organization aggregate (optional, same PR or follow-up)

- When listing organizations, optionally populate `Organization.projectIds` from a count or id list query so the dashboard org view stays truthful.

---

## Task 9 (later phase): Client area

- Point `app/client/projects` and `app/client/projects/[id]` at the same Supabase helpers; rely on RLS so clients and users only see allowed rows.
- Remove or narrow mock dependency in `getVisibleProjects` once all roles use live data.

---

## Execution order

1. **Task 5** can ship independently (UI-only) alongside or before Supabase wiring.
2. ~~Task 2 (schema)~~ ~~Task 3 (RLS)~~ ✅ — schema + RLS in place before relying on client wiring in production.
3. Task 4 provides the API surface for 6–7.
4. Tasks 8–9 can follow after dashboard paths are verified against real data.

---

## Plan mode note

The `/agent-os/shape-spec` command assumes **Cursor plan mode**. If this spec was generated outside plan mode, re-run shaping there if your team requires it.
