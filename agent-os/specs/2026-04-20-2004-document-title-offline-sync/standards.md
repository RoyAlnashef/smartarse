# Standards for Document Title Offline Sync

The following standards apply to this work.

---

## global/developer-guide

Source: `agent-os/standards/global/developer-guide.md`

Key requirements relevant to this feature:

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; never expose secrets in browser code.
- Continue using anon key + RLS for user-scoped browser operations.
- Keep admin routes/actions role-gated and avoid bypassing RLS assumptions.
- Preserve practical MVP behavior while avoiding schema/flow drift.

---

## global/domain-data-layer

Source: `agent-os/standards/global/domain-data-layer.md`

Key requirements relevant to this feature:

- Align data-layer behavior with domain types and table shapes.
- When data behavior changes, update relevant type mappings and persistence logic together.
- Keep relationship assumptions explicit and avoid hidden cross-table coupling.
- Treat schema evolution and data-layer updates as coordinated work.

---

## global/project-conventions

Source: `agent-os/standards/global/project-conventions.md`

Key requirements relevant to this feature:

- Use `@/` imports for app/component/lib code.
- Follow established client/server boundaries (`"use client"` only where needed).
- Use existing toast patterns (`sonner`) for non-blocking UX messaging.
- Keep naming and file conventions consistent with existing repository patterns.
