# Projects table + dashboard wiring — Shaping Notes

## Scope

1. **Supabase**: Create a real `projects` table (and supporting structure) aligned with `Project` in `lib/types.ts`, scoped to `organizations` via `organization_id`.
2. **Dashboard**: Replace mock-backed project list and project detail flows with Supabase reads (and admin create/update when ready), following the same patterns as `lib/supabase/organizations.ts`.
3. **Client area** (`app/client/projects`, project detail): **deferred to a follow-up phase** after dashboard reads/mutations are stable; same RLS should allow client/user visibility without a second data layer.

## Decisions

- **`clientId` / `clientName` in TypeScript**: Keep existing `Project` fields for UI compatibility; map `organization_id` → `clientId` and org `name` → `clientName` in mappers (same approach as `User.clientId` ↔ `users.organization_id`).
- **Status**: App uses `live` | `archived`. DB stores the same enum/text values so `getVisibleProjects` semantics stay obvious; align with `202603240010_active_requires_organization.sql` (treat `live` like `active` for the “requires organization” check).
- **Assignments**: Prefer a junction table (e.g. `project_users`: `project_id`, `user_id`) over denormalized arrays for RLS and integrity; expose `assignedUserIds` in the app layer via queries or aggregates.
- **Credits**: The **`projects` table stores only used consumption** (e.g. `used_credits`). Do **not** persist per-project total/budget in Supabase; align naming with org-level credit fields where helpful. The `Project` type in `lib/types.ts` still has `totalCredits` for legacy UI—mappers may fill it from `organizations.credit_balance` or a placeholder until the UI is simplified.
- **Dashboard project cards**: Replace **“credits left”** with **“credits used”** in `components/dashboard/project-card.tsx`; adjust or remove **% used / bar** if there is no reliable total denominator (see Task 5 in `plan.md`).
- **`uploadedFileIds`**: Empty array from DB until `uploaded_files` (or storage metadata) is migrated; do not block projects table on files.
- **`lastActivity`**: Column updated on meaningful events later; initially default to `updated_at` or `created_at` in the mapper.
- **RLS**: Admins use existing `is_dashboard_admin()` for full dashboard CRUD; clients see projects for their org; `user` role sees projects they are assigned to via junction (per `auth-rbac.md`).
- **Visuals:** `visuals/project-card-credits-current.png` — current project card footer (“credits left” + % bar) before the credits-used change.

## Context

- **Visuals:** See `visuals/` (project card reference).
- **References:** See `references.md`.
- **Product alignment:** Mission + roadmap emphasize org-scoped, project-centric workspaces and moving off mocks toward Supabase; this work directly supports that MVP path.

## Standards Applied

- `global/domain-data-layer` — schema and mappers align with `lib/types.ts` and migration checklist.
- `javascript/auth-rbac` — `getVisibleProjects` rules must match RLS (admin / client org / user assignments).
- `global/app-routing-protected-shell` — dashboard remains client-auth-gated; enforcement is RLS + session.
- `global/project-conventions` — `@/` imports, browser client module for dashboard data, toasts for mutations.
