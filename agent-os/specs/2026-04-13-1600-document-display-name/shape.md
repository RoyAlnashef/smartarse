# Document display name — Shaping notes

## Scope

Give **dashboard admins** an optional **display name** per project document (`project_documents`). When set, the client **Sources** list and citation-related UI should prefer that label; when empty or unset, behaviour matches today (filename-based, including `fileNameWithoutExtension` for Sources). Extend the **n8n inbound webhook** JSON with document metadata (`id`, `name`, `display_name`) so Disrupt workflows can prefer friendly names in prompts and `sources[]`.

## Decisions

- **Canonical filename:** Keep existing `name` / storage path unchanged; add nullable **`display_name`** only for presentation and outbound metadata.
- **Unset display name:** `NULL` or whitespace-only after trim → treat as unset; UI falls back to current filename-based labels.
- **n8n:** Optional **`project_documents`** (or agreed field name) on each chat POST, built from the same document list the client loads. Workflows may ignore the field; Disrupt aligns separately.
- **Citations in-app:** No dedicated citation tooltip component exists yet; v1 plans **ReactMarkdown `a` / `title` resolution** using a map from loaded documents, with filename (and later id-in-href) matching. Numeric-only `[1]` markers deferred unless answer shape stabilises.

## Context

- **Visuals:** [visuals/admin-documents-table.png](./visuals/admin-documents-table.png) (Documents tab, row menu), [visuals/client-sources-panel.png](./visuals/client-sources-panel.png) (Sources list).
- **References:** See [references.md](./references.md).
- **Product alignment:** Project-centric workspace with explicit documents grounding chat ([mission.md](../../product/mission.md)); display names reduce friction for scanning Sources and matching citations.

## Standards applied

- `global/domain-data-layer` — new column + `UploadedFile` alignment, mocks, migration.
- `global/project-conventions` — `@/` imports, `cn`, dialogs, toasts.
- `css/ui-styling` — shadcn primitives, semantic tokens for admin edit UI.
