# References for Document Title Offline Sync

## Similar Implementations

### Existing display-name rename flow

- **Location:** `lib/supabase/documents.ts`
- **Relevance:** Contains `updateProjectDocumentDisplayName` and current canonical rename write path.
- **Key patterns to borrow:**
  - Input trimming and normalization
  - Supabase update + selected row return
  - Typed row-to-domain mapping

### Previous display-name spec

- **Location:** `agent-os/specs/2026-04-13-1600-document-display-name/`
- **Relevance:** Captures prior design intent for display name UX and data behavior.
- **Key patterns to borrow:**
  - Dashboard rename interaction expectations
  - Display name fallback behavior
  - Verification shape for admin flows

## Data references

### Project documents sample rows

- **Location:** `agent-os/product/notes-archive/data-examples/project_documents_rows.csv`
- **Relevance:** Demonstrates current `display_name` persistence in `project_documents`.

### Record manager sample rows

- **Location:** `agent-os/product/notes-archive/data-examples/record_manager_v2_rows.csv`
- **Relevance:** Shows target `document_title` values for offline-workflow parity.

## Visual references

- `visuals/rename-display-name-modal.png`
- `visuals/documents-table-after-rename.png`
- `visuals/project-documents-table-display-name-column.png`
- `visuals/record-manager-v2-document-title-column.png`

## Task 2 call-path notes (rename -> data layer)

### UI trigger path

- Dashboard documents table mounts `SortableProjectDocumentsTable` with `onSaveDisplayName` in:
  - `app/(dashboard)/projects/[id]/page.tsx`
- The display-name dialog save action in `SortableProjectDocumentsTable` calls:
  - `onSaveDisplayName(displayNameTarget.id, next)`
  - file: `components/upload/sortable-project-documents-table.tsx`
- In dashboard page, `onSaveDisplayName` is handled by:
  - `handleSaveDocumentDisplayName(documentId, displayName)`
  - file: `app/(dashboard)/projects/[id]/page.tsx`

### Data-layer write path

- `handleSaveDocumentDisplayName` calls:
  - `updateProjectDocumentDisplayName(documentId, { displayName })`
  - file: `lib/supabase/documents.ts`
- `updateProjectDocumentDisplayName` normalizes input and writes:
  - `.from("project_documents").update({ display_name: dbValue }).eq("id", documentId)`
  - then returns mapped `UploadedFile`

### Single insertion point for mirror sync

- Current canonical rename write path is only `updateProjectDocumentDisplayName` in `lib/supabase/documents.ts`.
- Current UI rename trigger path exists only in dashboard documents flow; persona table usage does not pass `onSaveDisplayName`.
- There are no existing `record_manager_v2` writes in app/lib TS/TSX code yet.
- Task 3 should insert mirror logic inside `updateProjectDocumentDisplayName` directly after (or around) primary `project_documents.display_name` persistence, preserving non-blocking behavior.
