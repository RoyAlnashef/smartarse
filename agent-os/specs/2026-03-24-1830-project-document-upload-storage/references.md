# References: Project document upload and storage

## Similar implementations (in repo)

### Admin project Documents tab

- **Location:** [app/(dashboard)/projects/[id]/page.tsx](../../../app/(dashboard)/projects/[id]/page.tsx)
- **Relevance:** Target surface for `FileDropzone`, `FileList`, and merged `projectFiles` / `readyDocumentIds`.
- **Patterns:** Supabase `getProjectById` when client exists; mock fallback; tab visibility `adminOnly` for Documents.

### Upload components

- **Location:** [components/upload/file-dropzone.tsx](../../../components/upload/file-dropzone.tsx), [file-list.tsx](../../../components/upload/file-list.tsx), [upload-config.ts](../../../components/upload/upload-config.ts)
- **Relevance:** Dropzone, table + skeleton empty state, accept string and user-facing type list.
- **Patterns:** Extend with progress, delete callback, optional upload queue.

### Global documents browser

- **Location:** [app/(dashboard)/documents/page.tsx](../../../app/(dashboard)/documents/page.tsx)
- **Relevance:** Table UX reference (Ready / Processing); filter/search; admin gate.

### Client Sources (read path for Phase B)

- **Location:** [components/client/project-detail/sources-selector.tsx](../../../components/client/project-detail/sources-selector.tsx), [app/client/projects/[id]/page.tsx](../../../app/client/projects/[id]/page.tsx)
- **Relevance:** Will list `UploadedFile`-shaped rows from Supabase per project.

### Data and types

- **Location:** [lib/types.ts](../../../lib/types.ts) (`UploadedFile`), [lib/mock-data.ts](../../../lib/mock-data.ts) (`uploadedFiles`)

### Supabase patterns

- **Location:** [lib/supabase/client.ts](../../../lib/supabase/client.ts), [lib/supabase/projects.ts](../../../lib/supabase/projects.ts)
- **Relevance:** Browser client guard, row fetch patterns for Phase B.

## Related specs

- [2026-03-24-1600-projects-supabase-dashboard/plan.md](../2026-03-24-1600-projects-supabase-dashboard/plan.md) — projects schema and dashboard wiring.
- [2026-03-24-1800-client-projects-supabase-data/plan.md](../2026-03-24-1800-client-projects-supabase-data/plan.md) — client project shell; Sources still mock until this work lands.

## Product and standards (canonical)

- [agent-os/product/tech-stack.md](../../product/tech-stack.md)
- [agent-os/product/mission.md](../../product/mission.md)
- [agent-os/standards/global/domain-data-layer.md](../../standards/global/domain-data-layer.md)
- [agent-os/standards/javascript/auth-rbac.md](../../standards/javascript/auth-rbac.md)
- [agent-os/standards/global/project-conventions.md](../../standards/global/project-conventions.md)
- [agent-os/standards/css/ui-styling.md](../../standards/css/ui-styling.md)
