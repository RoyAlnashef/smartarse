# Plan: Document Title Offline Sync

Spec folder: **2026-04-20-2004-document-title-offline-sync**

## Goal

When an admin edits a document display name in the dashboard, keep the existing write to `project_documents.display_name` and also attempt to mirror that value into `record_manager_v2.document_title` for offline workflow support.

## Scope

- First-pass MVP workaround only.
- Match rule: exact string match using original filename.
- If no matching `record_manager_v2` row exists: do not write there; show non-blocking admin toast.
- Do not create new `record_manager_v2` rows.

## Task 1: Save spec documentation

Create and populate:

- `plan.md`
- `shape.md`
- `standards.md`
- `references.md`
- `visuals/`

**Your todo(s):**
- Confirm this spec folder naming/timestamp convention is acceptable.
- Confirm all expected artifacts exist before coding starts.

**Test at end of task:**
- Verify this folder contains the four markdown docs and `visuals/`.
- Verify `visuals/` includes all screenshots from this shaping chat.

## Task 2: Map current rename flow and insertion point

- Trace rename flow from dashboard UI to data layer in `lib/supabase/documents.ts`.
- Confirm where rename save is triggered in dashboard documents UI.
- Define single write sequence:
  1. Update `project_documents.display_name`
  2. Attempt conditional update in `record_manager_v2.document_title`

**Your todo(s):**
- Confirm mirror sync should only run from the admin rename flow.
- Confirm non-blocking fallback behavior remains MVP policy.

**Test at end of task:**
- Produce call-path notes that show UI handler -> data-layer rename -> conditional mirror sync.
- Verify only one mirror update path exists (avoid duplicate writes).

## Task 3: Implement mirror update in data layer

- Extend `updateProjectDocumentDisplayName` in `lib/supabase/documents.ts`.
- Use original filename for exact match against `record_manager_v2.document_title`.
- If a match exists, update `document_title` to the new display name.
- Return structured result so UI can decide whether to show a warning toast when no match exists.
- Keep mirror-sync failures non-fatal to primary rename save.

**Your todo(s):**
- Confirm empty display name behavior for `record_manager_v2.document_title` (`NULL` vs unchanged) before implementation finalization.
- Confirm no extra logging requirements for MVP.

**Test at end of task:**
- Matching row case: both `project_documents.display_name` and `record_manager_v2.document_title` update.
- No-match case: `project_documents.display_name` updates; no new `record_manager_v2` row is created.
- Response payload includes enough metadata for UI toast logic.

## Task 4: Add non-blocking UX feedback

- Keep primary success behavior for rename.
- Show warning toast when mirror sync is skipped due to no match.
- Do not rollback primary rename when mirror sync cannot run.

**Your todo(s):**
- Approve warning copy (recommended: `Display name saved. Offline title sync skipped (no matching record).`).
- Confirm whether warning should always show or be deduplicated on rapid edits.

**Test at end of task:**
- Match case: success UI only.
- No-match case: success UI + non-blocking warning.
- Table row reflects new display name immediately after save.

## Task 5: Verification and guardrails

- Run lint/type-check for touched files.
- Validate all rename scenarios end-to-end in Supabase-backed environment.

**Your todo(s):**
- Run final acceptance in staging-like environment with admin account.
- Record release note that this is an MVP offline-workflow workaround.

**Test at end of task:**
- Lint/type-check passes for touched files.
- Manual verification passes for:
  - normal rename with match
  - rename with no match
  - clearing display name
- Supabase row checks confirm only intended writes occur.
