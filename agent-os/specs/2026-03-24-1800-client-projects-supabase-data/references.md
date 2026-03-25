# References

## Related spec

- [Projects table + dashboard wiring — plan](../2026-03-24-1600-projects-supabase-dashboard/plan.md) — schema, RLS, dashboard wiring; **Task 9** should cross-link to this client-projects spec when shipped.

## Data layer

- [`lib/supabase/projects.ts`](../../../lib/supabase/projects.ts) — `listProjectsForAuthUser`, `getProjectById`, mapping to app `Project` type.

## Dashboard reference UI

- [`components/dashboard/projects-workspace.tsx`](../../../components/dashboard/projects-workspace.tsx) — loading, error, Supabase vs mock fallback pattern.
- [`app/(dashboard)/projects/[id]/page.tsx`](../../../app/(dashboard)/projects/[id]/page.tsx) — detail flow with remote project fetch.

## Client routes and components

- [`app/client/layout.tsx`](../../../app/client/layout.tsx) — client-role gate for `/client/*`.
- [`app/client/projects/page.tsx`](../../../app/client/projects/page.tsx) — project list (to wire to Supabase).
- [`app/client/projects/[id]/page.tsx`](../../../app/client/projects/[id]/page.tsx) — project detail (shell + mocks for chat/sources).
- [`components/client/client-project-card.tsx`](../../../components/client/client-project-card.tsx) — card fields + `sourceLine()`.
- [`components/client/project-detail/project-detail-card.tsx`](../../../components/client/project-detail/project-detail-card.tsx) — PROJECT DETAIL card (`name`, `description`).

## Product

- [`agent-os/product/mission.md`](../../product/mission.md)

## Standards (canonical paths)

- [`agent-os/standards/global/domain-data-layer.md`](../../standards/global/domain-data-layer.md)
- [`agent-os/standards/javascript/auth-rbac.md`](../../standards/javascript/auth-rbac.md)
- [`agent-os/standards/global/app-routing-protected-shell.md`](../../standards/global/app-routing-protected-shell.md)
- [`agent-os/standards/global/project-conventions.md`](../../standards/global/project-conventions.md)

## Visuals (prior mocks)

- List: [`../2026-03-17-1200-sign-in-client-theme/visuals/project-list-9d8faa74-b076-455f-afed-467ed6121ad0.png`](../2026-03-17-1200-sign-in-client-theme/visuals/project-list-9d8faa74-b076-455f-afed-467ed6121ad0.png)
- Detail: [`../2026-03-17-1545-client-project-detail/visuals/project-detail-d65f8e9f-8542-44c4-92a6-f17dc32071e5.png`](../2026-03-17-1545-client-project-detail/visuals/project-detail-d65f8e9f-8542-44c4-92a6-f17dc32071e5.png)
