# Verification — document display name

Manual checks after implementation:

1. **Migration** — Apply `202604131600_project_documents_display_name.sql` to Supabase; confirm `project_documents.display_name` exists.
2. **Admin** — Open a project (Supabase-backed) → Documents → **Edit display name** on a persisted row → Save → table shows primary label + filename subline when set; **Clear** display name (empty field + Save) → reverts to filename-only row.
3. **Client** — Same project as a client user → **Sources** shows display name when set; after clear, shows stem of filename as before.
4. **Webhook** — Browser devtools → Network → POST to n8n URL → JSON body includes `project_documents` with `id`, `name`, `display_name` when at least one ready document exists.
5. **Citations** — Assistant message with a markdown link whose `href` contains a document UUID or filename → hover `title` reflects friendly label when `display_name` is set (see `resolveCitationLinkTitle` in [`lib/documents/display-label.ts`](../../../lib/documents/display-label.ts)).
6. **RLS** — Non–dashboard-admin session cannot `UPDATE` `display_name` (existing `project_documents_update_admin` policy).

Automated: run `npx tsc --noEmit` from repo root.
