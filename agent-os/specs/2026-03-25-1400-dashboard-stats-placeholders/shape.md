# Dashboard stats placeholders — Shaping notes

## Scope

- Redesign `/dashboard` stat bar: **Projects**, **Queries**, **Users**, **Organizations**.
- Phase 1: fixed placeholder numbers; phase 2: Supabase.
- Below the stat bar: **2–3 skeleton zones** (activity, trend, quick links) — not an empty main area.
- **Admin dashboard focus**; client-specific dashboard work deferred.

## Decisions

- Placeholder stats are explicit constants in code (design-first, no mock derivation for counts).
- `QueryLog` / queries table TBD in Supabase for phase 2.
- Reuse existing stat card styling (`rounded-xl border bg-card`, icon wells, `lucide-react`).

## Context

- **Visuals:** `visuals/baseline-dashboard-four-stats.png` (prior four-metric dashboard).
- **References:** See `references.md`.
- **Product alignment:** Org-scoped projects, usage, team — aligns with `agent-os/product/mission.md`.

## Standards applied

- `css/ui-styling` — feature components under `components/dashboard/`, semantic tokens, Lucide.
- `global/project-conventions` — `@/` imports, client components where hooks are used.
