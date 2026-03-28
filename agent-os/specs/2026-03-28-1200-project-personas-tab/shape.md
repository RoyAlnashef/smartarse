# Project Personas tab and Supabase — Shaping notes

## Scope

- **Admin dashboard:** New **Personas** tab on the project detail page (after **Documents**), admin-only, mirroring the Documents tab layout: sortable table, upload dialog, reorder + save/cancel, and Supabase-backed list/upload/delete/reorder.
- **Data layer:** New `project_personas` table, private `project-personas` storage bucket, and `reorder_project_personas` RPC, parallel to `project_documents` / `project-documents` / `reorder_project_documents`.
- **Shared upload UX:** Extend shared upload config and dropzone so **Documents** can accept `.md`; Personas uses stricter markdown-only acceptance for the new bucket.
- **Client project page:** **Segments** in the persona panel loads real personas when the project is loaded from Supabase (`useRemoteDetail`); markdown file personas get a dedicated detail view (signed URL + fetch) instead of the mock survey card.
- **Offline / mock:** Personas tab and client behavior fall back to the same mock patterns as documents when Supabase is unavailable.
- **Project lifecycle:** Deleting a project removes persona storage objects using the same chunking approach as documents.

## Decisions

- **Client panel:** When remote data is available and the project has at least one persona file, the Segments list and applied-persona experience use **real markdown-backed personas** (ordered by `sort_order`, then `uploaded_at`). When remote is off or personas list is empty, **keep existing mock segment personas** and empty-state copy that points admins to upload.
- **Type modeling:** Represent an applied persona as a **discriminated union** (or parallel props) separating mock survey personas from file-backed markdown personas so `PersonaDetailCard` assumptions are not forced onto storage-backed rows.
- **UI reuse:** Parameterize the sortable project documents table (labels / empty state / footer) rather than duplicating the full Documents implementation for Personas.
- **RLS intent:** Match `project_documents`: members who can read the project can `select` personas; dashboard admins mutate rows and storage per existing RBAC helpers.

## Context

- **Visuals:** [visuals/](./visuals/) — Documents tab layout reference for Personas parity.
- **References:** [references.md](./references.md).
- **Product alignment:** [agent-os/product/mission.md](../../product/mission.md) — project-scoped artifacts and role-appropriate access.

## Standards applied

- **domain-data-layer** — `UploadedFile`-shaped rows where the mapper matches documents; document personas as project-scoped files in standards notes.
- **auth-rbac** — Admin-only dashboard tab; server-side RLS aligned with document policies.
- **project-conventions** — `@/` imports, client boundaries, toasts.

Full text: [standards.md](./standards.md).
