# References: Project Personas tab and Supabase

## Documents implementation (parallel patterns)

### Admin project Documents tab

- **Location:** [app/(dashboard)/projects/[id]/page.tsx](../../../app/(dashboard)/projects/[id]/page.tsx)
- **Relevance:** Tab order, `adminOnly` uploads tab, merged remote + local file state, reorder save/cancel, upload dialog wiring.
- **Patterns:** Mirror for Personas tab immediately after `"uploads"`; reuse sortable table with parameterized copy.

### Sortable table and upload flow

- **Location:** [components/upload/sortable-project-documents-table.tsx](../../../components/upload/sortable-project-documents-table.tsx), [use-supabase-project-upload-flow.ts](../../../components/upload/use-supabase-project-upload-flow.ts), [use-mock-project-documents.ts](../../../components/upload/use-mock-project-documents.ts)
- **Relevance:** Drag reorder, stable IDs, Supabase vs mock branches.
- **Patterns:** Optional labels prop (or object); clone upload hook for `personas.ts` APIs.

### Dropzone and validation

- **Location:** [components/upload/file-dropzone.tsx](../../../components/upload/file-dropzone.tsx), [upload-config.ts](../../../components/upload/upload-config.ts)
- **Relevance:** `accept`, type description, `validateFileForUpload`, extension inference.
- **Patterns:** Optional `accept` / `typesDescription`; shared `.md` support for Documents; persona-specific config for markdown-only Personas bucket.

### Supabase documents access

- **Location:** [lib/supabase/documents.ts](../../../lib/supabase/documents.ts)
- **Relevance:** List, upload, delete, reorder, content types for storage.
- **Patterns:** New [lib/supabase/personas.ts](../../../lib/supabase/personas.ts) + signed URL helper for client markdown preview.

### Migrations (schema reference)

- **Location:** [supabase/migrations/202603261200_project_documents_storage.sql](../../../supabase/migrations/202603261200_project_documents_storage.sql), [supabase/migrations/202603311500_project_documents_sort_order.sql](../../../supabase/migrations/202603311500_project_documents_sort_order.sql)
- **Relevance:** `project_documents` shape, indexes, RLS, storage policies, `reorder_project_documents`.

### Project delete and storage cleanup

- **Location:** [lib/supabase/projects.ts](../../../lib/supabase/projects.ts)
- **Relevance:** Remove document objects when deleting a project; extend for `project_personas` paths.

### Client project page and persona UI

- **Location:** [app/client/projects/[id]/page.tsx](../../../app/client/projects/[id]/page.tsx), [components/client/project-detail/persona-drawer.tsx](../../../components/client/project-detail/persona-drawer.tsx)
- **Relevance:** `listProjectDocuments` pattern for remote detail; Segments tab and applied persona UX.

### Types and mock seed

- **Location:** [lib/types.ts](../../../lib/types.ts) (`UploadedFile`), [lib/mock-data.ts](../../../lib/mock-data.ts)

## Related specs

- [2026-03-24-1830-project-document-upload-storage/plan.md](../2026-03-24-1830-project-document-upload-storage/plan.md) — document upload phases and Supabase alignment.
- [2026-03-19-1000-personas-right-column/plan.md](../2026-03-19-1000-personas-right-column/plan.md) — persona column UX baseline.

## Product and standards (canonical)

- [agent-os/product/mission.md](../../product/mission.md)
- [agent-os/product/tech-stack.md](../../product/tech-stack.md)
- [agent-os/standards/global/domain-data-layer.md](../../standards/global/domain-data-layer.md)
- [agent-os/standards/javascript/auth-rbac.md](../../standards/javascript/auth-rbac.md)
- [agent-os/standards/global/project-conventions.md](../../standards/global/project-conventions.md)
- [agent-os/standards/css/ui-styling.md](../../standards/css/ui-styling.md)

## Visual references

- [visuals/01-dashboard-project-documents-tab-layout-reference.png](./visuals/01-dashboard-project-documents-tab-layout-reference.png) — Layout reference for Personas tab (Documents tab on Disrupt project page).
