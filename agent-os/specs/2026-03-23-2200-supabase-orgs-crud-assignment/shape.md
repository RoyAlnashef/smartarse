# Supabase Organizations + User Assignment — Shaping Notes

## Scope

Wire admin dashboard organization management to Supabase for:

- Real organizations list on dashboard Organizations page
- Create organization
- Update organization
- Soft-delete organization (inactive state, no hard delete)
- Assign users to organizations from Users page only

## Decisions

- Use existing Organizations and Users dashboard flows as primary implementation references.
- Keep this spec focused on wiring real data and mutations; do not redesign the UI.
- Treat delete behavior as soft-delete only.
- Keep assignment scope limited to Users page (not org-members management UI in Organizations page).
- Use provided screenshots as operational context (current UI + Supabase data reality), not visual design requirements.

## Visual Context

- `visuals/current-organizations-dashboard.jpg` — current placeholder Organizations dashboard view.
- `visuals/supabase-organizations-table.jpg` — Supabase table snapshot with real organization rows.

## Product Alignment

From product docs:

- Product is org-scoped and role-aware, with admin workflows separated from client experience.
- MVP direction is Supabase-backed auth/data replacing mock flows.
- Credits and organization visibility remain important domain concerns while wiring real data.

## Constraints

- Preserve existing admin-only dashboard access patterns.
- Follow current project conventions (`@/` imports, client boundary patterns, toast usage).
- Keep implementation incremental and low-risk: replace data source and mutations without broad restructuring.

## Standards Applied

- `global/domain-data-layer` — align types and relations with Supabase-backed entities.
- `javascript/auth-rbac` — preserve role assumptions and avoid client-only security reliance.
- `global/app-routing-protected-shell` — keep protected-shell behavior and route flow intact.
- `global/project-conventions` — maintain import, naming, and UI feedback conventions.
