# References for Projects table + dashboard wiring

## Similar implementations

### Organizations Supabase module

- **Location:** `lib/supabase/organizations.ts`
- **Relevance:** Canonical pattern for dashboard CRUD against Supabase from the browser client (`getSupabaseBrowserClient`), row types, `rowTo*` mappers, and error handling.
- **Key patterns:** `list*ForDashboard`, `create*`, `update*` with `.select()` after write; member counts via a secondary query.

### Admin RLS migrations

- **Location:** `supabase/migrations/202603232355_admin_rls_users_organizations.sql`, `supabase/migrations/202603240010_active_requires_organization.sql`
- **Relevance:** `is_dashboard_admin()` helper and org/user policies; deferred `projects` constraint when `organization_id` + `status` exist.
- **Key patterns:** Admin-only mutate policies; follow same style for `projects` and junction table.

### Auth + visible projects

- **Location:** `lib/auth-context.tsx`
- **Relevance:** `getVisibleProjects()` is the single client-side source for list filtering by role today (mock data).
- **Key patterns:** Replace or augment with Supabase-backed list once RLS encodes the same rules.

### Dashboard projects UI

- **Location:** `components/dashboard/projects-workspace.tsx`, `components/dashboard/project-card.tsx`, `components/dashboard/project-filters.tsx`
- **Relevance:** List page expects `Project[]` with `clientName`, filters, and admin “Add Project” affordance.
- **Key patterns:** Keep component props stable; swap data source behind a hook or page-level fetch.
- **`project-card.tsx`:** Footer today shows **credits left** and **% used** from `usedCredits` / `totalCredits` (see spec `visuals/project-card-credits-current.png`); Task 5 switches to **credits used** and reconciles the bar with “used only” storage.

### Project detail (dashboard)

- **Location:** `app/(dashboard)/projects/[id]/page.tsx`
- **Relevance:** Currently imports `projects` from `lib/mock-data`; tabs include chat, documents, members, settings.
- **Key patterns:** Load project by `id` from Supabase; keep loading/error UX consistent with other dashboard pages.

### Client project surfaces

- **Location:** `app/client/projects/[id]/page.tsx`, `components/client/client-project-card.tsx`
- **Relevance:** Second phase: same `Project` shape and RLS should drive these routes without duplicating business logic.

### Prior spec — project members UI

- **Location:** `agent-os/specs/2026-03-24-1400-project-users-tab-assignment/`
- **Relevance:** Members tab UX; wiring assignments should eventually call APIs or mutations that write the junction table.

## Domain source of truth

- **Location:** `lib/types.ts` (`Project` interface), `lib/mock-data.ts` (seed shapes until fully retired).
