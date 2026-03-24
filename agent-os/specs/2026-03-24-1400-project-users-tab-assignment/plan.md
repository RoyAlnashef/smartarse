# Project Users assignment (UX)

## Task 1: Spec documentation

This folder (`agent-os/specs/2026-03-24-1400-project-users-tab-assignment/`) holds shaping artifacts: `shape.md`, `standards.md`, `references.md`, `visuals/`.

## Task 2: Tab wiring

- Extend `tabs` in `app/(dashboard)/projects/[id]/page.tsx`: add Users tab (`Users` icon from `lucide-react`) between Documents and Settings with `adminOnly: true`.
- Render tab content in a scrollable, padded container consistent with Documents/Settings.

## Task 3: `ProjectUsers` component

- Location: `components/projects/project-users.tsx`.
- Props: `project`, `allUsers`.
- Eligible users: `clientId === project.clientId`.
- Local state: `Set` from `project.assignedUserIds` (in-memory only).
- Search filters by name/email; list with assign toggles; role and status visible.

## Task 4: Polish

- Empty states; inactive users: block new assignment, allow remove if already assigned.
- Styling per `agent-os/standards/css/ui-styling.md`.

## Out of scope

- Supabase persistence; client `/client/projects/[id]` surface.
