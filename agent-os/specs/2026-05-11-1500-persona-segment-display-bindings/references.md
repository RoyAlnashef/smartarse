# References — Persona segment display bindings

Anchors are approximate; use search within files when line numbers drift.

## Product / mock source

### `components/client/project-detail/persona-drawer.tsx`

- **`MOCK_SEGMENT_PERSONAS`** — canonical segment ids, titles, mock research fields, and current segment-only UI assumptions.
- **`customAudienceDotClass`** — to be replaced or generalized to cite-token–based dot classes.
- **`draftToSnapshot`** — should emit segment names / `colorToken` from the resolver once bound display exists.

## Data layer

### `supabase/migrations/202603311600_project_personas_storage.sql`

- `project_personas` table, storage bucket, and RLS policies for read/update.

### `supabase/migrations/202604131600_project_documents_display_name.sql`

- Reference for `display_name` semantics on documents (mirror for persona segment display name).

### `supabase/migrations/202605072220_expand_project_documents_cite_color_token_shades.sql`

- Cite color token allowlist evolution; **`segment_color_token`** should stay aligned with this family of constraints and `lib/theme/cite-color-tokens.ts`.

### `lib/supabase/personas.ts`

- Persona fetch/select/insert/update — extend for new columns and validation helpers.

### `lib/supabase/documents.ts`

- **`updateProjectDocumentDisplayName`**, **`updateProjectDocumentCiteColor`** — patterns for PATCH helpers and error surfacing.

### `lib/types.ts`

- **`UploadedFile`** (or adjacent persona type) — add optional fields with JSDoc for DB mapping.

## Theme and chat

### `lib/theme/cite-color-tokens.ts`

- Allowlist / types for cite (and segment) color tokens.

### `lib/theme/persona-segment-theme.ts`

- **`PERSONA_SEGMENT_COLOR_TOKEN_BY_ID`**, **`personaSegmentColorTokenForId`** — extend or wrap to use resolver-aware tokens.

### `lib/theme/persona-chat-tone.ts`

- **`PERSONA_CHAT_TONE_BY_ID`** — align with resolved color / family or default tone.

### `lib/theme/custom-audience-dominant-persona.ts`

- **`chatHistoryPrimaryPersonaColorToken`** — must remain correct when tokens are no longer only the four hardcoded map entries.

## Client surfaces

### `app/client/projects/[id]/page.tsx`

- Fetch `project_personas`; thread resolved segments into chat and drawers; persona segment persist block; restore logic for `persona_segment_id`.

### `components/client/project-detail/mobile-persona-drawer.tsx`

- Pass-through for resolved segment props (parity with desktop panel).

### `components/client/project-detail/project-chat.tsx`

- Composer / shell accents driven by segment selection — consume resolved segment view.

### `hooks/useChatQuestion.ts`

- Persist payload: `persona_segment_name`, `persona_segment_color_token` from resolved values.

## Admin UI patterns

### `app/(dashboard)/projects/[id]/page.tsx`

- Personas tab table and actions.

### `components/upload/sortable-project-documents-table.tsx`

- Swatch column, row actions, dialogs — UX reference for Personas tab extensions.

## Related specs

- [2026-05-11-custom-audience-explore-before-save](../2026-05-11-custom-audience-explore-before-save/) — adjacent persona drawer / chat persistence work.
