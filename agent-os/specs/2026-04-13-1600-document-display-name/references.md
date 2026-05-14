# References for document display name

## Similar implementations (in repo)

### Admin project Documents tab

- **Location:** [app/(dashboard)/projects/[id]/page.tsx](../../../app/(dashboard)/projects/[id]/page.tsx)
- **Relevance:** Documents tab state, remote `projectFiles`, upload/delete/reorder flows; wire **edit display name** and optimistic updates here.
- **Patterns:** Supabase-backed list; `SortableProjectDocumentsTable`.

### Sortable documents table

- **Location:** [components/upload/sortable-project-documents-table.tsx](../../../components/upload/sortable-project-documents-table.tsx)
- **Relevance:** Row actions dropdown (Delete today); add **Edit display name** + dialog.
- **Patterns:** `UploadedFile`, `DropdownMenu`, persisted-row checks.

### Client Sources

- **Location:** [components/client/project-detail/sources-selector.tsx](../../../components/client/project-detail/sources-selector.tsx), [app/client/projects/[id]/page.tsx](../../../app/client/projects/[id]/page.tsx)
- **Relevance:** Replace raw `fileNameWithoutExtension(file.name)` with shared label helper when `displayName` exists.

### Project chat (citations / markdown)

- **Location:** [components/client/project-detail/project-chat.tsx](../../../components/client/project-detail/project-chat.tsx)
- **Relevance:** `ReactMarkdown` — extend `components.a` (and optional `title`) using document id/name map from props.

### Documents data access

- **Location:** [lib/supabase/documents.ts](../../../lib/supabase/documents.ts)
- **Relevance:** `listProjectDocuments`, `rowToUploadedFile`, `documentSelect`; add **update** for `display_name`, extend select/row type.

### Types and mocks

- **Location:** [lib/types.ts](../../../lib/types.ts) (`UploadedFile`), [lib/mock-data.ts](../../../lib/mock-data.ts), [components/upload/use-mock-project-documents.ts](../../../components/upload/use-mock-project-documents.ts)

### Chat webhook

- **Location:** [hooks/useChatQuestion.ts](../../../hooks/useChatQuestion.ts)
- **Relevance:** `ChatQuestionWebhookPayload` — add optional **`project_documents`** (or agreed name) array.

### n8n coordination (update during implementation)

- **Location:** [agent-os/specs/2026-03-26-1400-project-chat-n8n-integration/disrupt-n8n-coordination.md](../../2026-03-26-1400-project-chat-n8n-integration/disrupt-n8n-coordination.md), [n8n-engineer-handoff.md](../../2026-03-26-1400-project-chat-n8n-integration/n8n-engineer-handoff.md)

### Prior document storage spec

- **Location:** [agent-os/specs/2026-03-24-1830-project-document-upload-storage/](../2026-03-24-1830-project-document-upload-storage/) — upload/storage/references baseline.

## Product and standards (canonical)

- [agent-os/product/mission.md](../../product/mission.md)
- [agent-os/standards/global/domain-data-layer.md](../../standards/global/domain-data-layer.md)
- [agent-os/standards/global/project-conventions.md](../../standards/global/project-conventions.md)
- [agent-os/standards/css/ui-styling.md](../../standards/css/ui-styling.md)
