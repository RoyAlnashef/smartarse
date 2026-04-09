# Admin Project Chat History - Shaping Notes

## Scope

Build a new admin-facing chat history experience in the dashboard project detail Chat tab that shows all project-user conversations for a selected project. Admins can browse, filter by user, and open a thread to inspect full stored context in read-only mode.

## Decisions

- Keep existing client `/api/chat/*` behavior unchanged (self-history only).
- Add dedicated admin endpoints for project-wide history/result reads.
- Enforce admin authorization and org/project scoping server-side.
- Reuse existing message hydration utilities (`lib/chat-thread.ts`) for timeline rendering.
- Maintain read-only chat behavior for admins in dashboard.

## Context

- **Visuals:** Provided screenshot from this shaping session, referenced in `visuals/README.md`.
- **References:** `2026-04-01-1600-chat-history-thread-load-continue` and `2026-03-26-1400-project-chat-n8n-integration` specs plus existing dashboard/client chat code.
- **Product alignment:** Project-centric, auditable conversations with role-based access boundaries.

## Standards Applied

- `global/domain-data-layer` - typed contracts and data-layer consistency.
- `javascript/auth-rbac` - admin-only access and server enforcement.
- `global/app-routing-protected-shell` - dashboard shell/auth behavior expectations.
- `global/project-conventions` - import boundaries and implementation conventions.
