# Document Title Offline Sync - Shaping Notes

## Scope

Implement a minimal MVP workaround so admin document rename in dashboard writes to both:

- `project_documents.display_name` (existing behavior)
- `record_manager_v2.document_title` (new mirror behavior, conditional)

This supports offline workflows ahead of full architecture unification.

## Decisions

- New behavior is triggered when admin saves display name.
- Match logic uses exact string match on original filename.
- If `record_manager_v2` has no matching row, do not write and do not block rename.
- UI should show a non-blocking warning when offline sync is skipped (no match).
- No backfill and no row creation in this pass.

## Constraints

- MVP-first reliability over architectural completeness.
- Preserve existing rename UX and avoid regressions.
- Keep write-path safe: primary save must succeed even if mirror step cannot run.

## Context

- **Visuals:** Included in `visuals/` from this chat.
- **References:** Existing rename implementation and prior display-name spec.
- **Product alignment:** Supports admin workflows and offline data continuity for MVP launch.

## Standards Applied

- `global/developer-guide` - preserve Supabase security boundaries and pragmatic delivery.
- `global/domain-data-layer` - keep domain mapping and persistence behavior consistent.
- `global/project-conventions` - maintain import/style/UI conventions in touched code.
