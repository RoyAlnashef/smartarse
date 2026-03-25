# Spec: Project document upload UX and Supabase storage

## Visuals (this spec)

Copies live in [visuals/](./visuals/):

| File | Role |
|------|------|
| `01-dashboard-project-documents-tab.png` | Admin project detail, Documents tab: dropzone, skeleton list, file types copy. |
| `02-supabase-storage-buckets.png` | Supabase Storage: existing `podcasts` bucket; new docs bucket to add in Phase 2. |
| `03-dashboard-documents-page.png` | Global `/documents`: table with Ready / Processing badges (upload button deferred). |
| `04-client-sources-empty.png` | Client project chat: Sources card empty state (sync with Supabase in later task). |

## Why Supabase Storage

Buckets fit binary blobs (PDF, Office, CSV). Use a **private bucket** plus **Postgres rows** for `project_id`, `status`, `uploaded_by`, and `storage_path` so chat/RAG and the UI query metadata under RLS. Keep **service role off the client**; use anon + RLS for uploads or a **signed-URL route** / **server action** if you prefer not to expose permissive storage policies to the browser.

## Current codebase anchors

- Project Documents tab: [app/(dashboard)/projects/[id]/page.tsx](../../../app/(dashboard)/projects/[id]/page.tsx) — `FileDropzone onUpload={() => {}}` is a no-op; `projectFiles` is only `uploadedFiles.filter(...)` from [lib/mock-data.ts](../../../lib/mock-data.ts).
- Upload UI: [components/upload/file-dropzone.tsx](../../../components/upload/file-dropzone.tsx), [components/upload/file-list.tsx](../../../components/upload/file-list.tsx), [components/upload/upload-config.ts](../../../components/upload/upload-config.ts) (accept list + copy; add **numeric max size**, e.g. 50MB, validate in handler).
- Domain type: [lib/types.ts](../../../lib/types.ts) — `UploadedFile` with `status: "processing" | "ready" | "error"`.
- Client Sources panel: [components/client/project-detail/sources-selector.tsx](../../../components/client/project-detail/sources-selector.tsx) fed from [app/client/projects/[id]/page.tsx](../../../app/client/projects/[id]/page.tsx) with the same mock filter — **does not reflect admin-only in-memory mock uploads** until Supabase; acceptable for “resets on reload” mock phase.

## Mock UX: states to implement

Target the **admin** project detail **Documents** tab first. Global [app/(dashboard)/documents/page.tsx](../../../app/(dashboard)/documents/page.tsx) can stay browse/filter of mock data until an upload entry point is added.

| State | UI behavior |
|--------|-------------|
| **Idle** | Existing dropzone + “Choose files” |
| **Validation error** | `sonner` toast; reject wrong extension or file > 50MB |
| **Uploading (simulated)** | Per-file progress (`@/components/ui/progress` or mint-styled bar); optional queue above table |
| **Row: processing** | After simulated bytes, `UploadedFile` with `status: "processing"` |
| **Row: ready** | Timer → `status: "ready"` |
| **Row: error** | Optional simulated failure → `status: "error"` + toast |
| **Delete** | Dropdown removes from local state (mock) |
| **Empty list** | Keep skeleton empty pattern or split loading vs empty when real fetch exists |

**Chat coherence:** Merge **local** `UploadedFile[]` with mock seed for this `projectId` when computing `readyDocumentIds` and `projectFiles` so admin chat can attach context to newly ready docs.

```mermaid
flowchart LR
  subgraph adminTab [Admin Documents tab]
    Files[File[] from input]
    Val[Validate type and size]
    Sim[Simulate progress]
    Row[Append UploadedFile processing]
    Ready[Transition to ready]
    List[FileList + merged mock]
  end
  Files --> Val
  Val --> Sim
  Sim --> Row
  Row --> Ready
  Ready --> List
```

## Phase 2: Supabase (after UX is stable)

1. **Storage:** New bucket (e.g. `project-documents`), private, size/MIME aligned with [upload-config.ts](../../../components/upload/upload-config.ts). Separate from `podcasts`.
2. **DB:** Table e.g. `project_documents` — align with `UploadedFile` and [domain-data-layer](../../standards/global/domain-data-layer.md).
3. **RLS:** Admins (and optionally org clients) scoped to allowed projects; members read where needed for Sources/chat.
4. **App wiring:** [lib/supabase/documents.ts](../../../lib/supabase/documents.ts) (list/insert/update), policy-compliant upload or signed URL; replace local merge with query + optimistic UI.
5. **Client project page:** Load documents for [SourcesSelector](../../../components/client/project-detail/sources-selector.tsx).

## Implementation checkpoints (pause and test)

Stop after each group below, run the app, and verify before moving on.

| After | What to test |
|--------|----------------|
| **Phase 1 — Mock upload (project Documents tab)** | Open a project as admin → Documents → drop or choose files → validation toasts (oversize / wrong type) → per-file progress → Processing → Ready; delete removes only session uploads; reload clears session uploads; Chat tab still gets `documentIds` for ready session + seed docs. |
| **Phase 2 — Supabase storage + DB** | Real upload to bucket; row in `project_documents`; RLS: admin OK, others denied as designed; list survives reload. |
| **Phase 3 — Client Sources sync** | Client project page shows same documents as dashboard for that project. |

## Implementation tasks (after this spec)

1. **Phase 1:** Mock upload hook, `FileList` extensions, wire project page (`onUpload`, merge, `readyDocumentIds`, toasts). **Pause here** (see table above).
2. **Phase 2:** Supabase migration (bucket + table + RLS), `lib/supabase/documents.ts`, replace mock merge with fetch/upload. **Pause here.**  
   *Shipped in repo:* migration [`supabase/migrations/202603261200_project_documents_storage.sql`](../../../supabase/migrations/202603261200_project_documents_storage.sql), module [`lib/supabase/documents.ts`](../../../lib/supabase/documents.ts), admin project page uses remote docs when Supabase + session are active (mock path unchanged when Supabase is off).
3. **Phase 3:** Client sources: fetch documents on `app/client/projects/[id]/page.tsx` when API exists. **Pause here.**

## Your tasks (alongside the agent)

**Environment and secrets**

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only; never in the browser bundle or committed files.
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` locally and on each deployed environment when Phase 2 is enabled.

**Supabase project (Phase 2)**

- Apply migrations (CLI or SQL Editor).
- If the bucket is not created by SQL: create a **private** bucket in Dashboard, ~50MB limit, MIME types aligned with upload config.
- Review RLS and Storage policies; smoke-test admin vs non-admin.

**Product**

- Confirm admin-only upload vs org **client** upload for RLS and UI.

**Deployment**

- Mirror env vars and migrations to preview/staging before production; optionally prune test Storage objects between demos.

## Traceability

- Shaping notes: [shape.md](./shape.md)
- Standards snapshot: [standards.md](./standards.md)
- Code pointers: [references.md](./references.md)
