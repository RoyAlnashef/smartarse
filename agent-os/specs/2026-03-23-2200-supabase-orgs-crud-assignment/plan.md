# Supabase Organizations in Dashboard — Plan

## Progress

- Task 1: Complete
- Task 2: Complete
- Task 3: Complete
- Task 4: Complete
- Task 5: Complete

## Task 1: Save Spec Documentation

Create and maintain this spec folder with:

- `plan.md` — full implementation plan and execution order
- `shape.md` — shaping notes and decisions
- `standards.md` — relevant standards and key constraints
- `references.md` — internal code references and reuse patterns
- `visuals/` — operational screenshots (not UI design direction)

## Task 2: Replace Organizations Mock List with Supabase Data

- Add a typed organizations data layer in `lib/supabase/organizations.ts`.
- Load organizations from Supabase in `app/(dashboard)/organizations/page.tsx`.
- Preserve existing search/filter UX while mapping Supabase fields to UI model:
  - `credit_balance` -> `creditBalance`
  - `created_at` / `updated_at` -> UI dates
  - `slug` retained for display/edit safety checks

## Task 3: Wire Organization Create/Update + Soft Delete

- Connect organization form save actions to Supabase create/update.
- Implement soft-delete as status transition to inactive (no row deletion).
- Surface row-level org actions from `components/organizations/organization-table.tsx`.
- Ensure active/inactive UI tabs reflect persisted status.

## Task 4: Implement User Assignment via Users Page

- Keep assignment surface on Users page only.
- Replace mock organization options with live organizations.
- Persist assignment by updating `public.users.organization_id`.

## Task 5: Type Alignment, UX Feedback, and Verification

- Align relevant fields in `lib/types.ts` with Supabase mappings used in org/user flows.
- Use toast feedback for success/failure across mutations.
- Preserve current auth + RBAC route behavior.
- Run lint and resolve issues introduced by these changes.

## Acceptance Criteria

- Organizations page loads real organizations from Supabase.
- Admin can create and update organizations from dashboard UI.
- Delete action performs soft-delete only (inactive status).
- Admin can assign users to organizations from Users page.
- Flows no longer depend on mock org/user list data.

