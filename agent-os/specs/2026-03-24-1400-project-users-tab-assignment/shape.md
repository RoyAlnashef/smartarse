# Project Users tab — Shaping notes

## Scope

- Admin-only **Users** tab on dashboard project detail (`/projects/[id]`) to assign organization members to a project.
- **Front-end only:** mock data + React state; no Supabase `projects` table writes.
- Assignees must belong to the project’s organization (`user.clientId === project.clientId`).

## Decisions

| Decision | Choice |
|----------|--------|
| Tab placement | Between **Documents** and **Settings** |
| Visibility | `adminOnly: true` (same as Documents) |
| Eligibility | Org members only; platform admins without `clientId` excluded |
| Persistence | In-memory; seed from `project.assignedUserIds` |
| Inactive users | Cannot newly assign; if already assigned, can remove |

## Context

- **Visuals:** `visuals/reference-project-detail.png` (Disrupt project header + tab strip reference).
- **References:** See `references.md`.
- **Product alignment:** Project-centric workspace; org-scoped access matches `agent-os/product/mission.md` and RBAC in `auth-rbac.md`.

## Standards applied

- `css/ui-styling` — tokens, `cn`, focus rings, lucide icons.
- `global/domain-data-layer` — `Project.assignedUserIds`, org relations.
- `javascript/auth-rbac` — admin vs client/user roles.
- `global/project-conventions` — `@/` imports, feature folder placement.
