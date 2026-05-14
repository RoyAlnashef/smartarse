# Shape: Persona-backed segment display (fixed four slots)

## Problem

Study **segments** are defined today by four canonical string ids (`seg-do-nothing`, `seg-minimalists`, `seg-muddled-middle`, `seg-do-their-bit`) and mock metadata in [`MOCK_SEGMENT_PERSONAS`](../../../components/client/project-detail/persona-drawer.tsx). Uploaded **persona files** live in `project_personas` but are not first-class overrides for how those four slots appear in the client Segments UI, custom-audience dots, or chat chrome. Product wants **admin-editable display** (name, description, color) plus an optional **one-to-one binding** from a persona file to a canonical segment, without migrating segment identity to UUIDs.

## Scope (in)

- **Canonical ids unchanged** — filters, `chat_results.persona_segment_id`, custom-audience `childSegments[].id`, and dominant-segment logic keep using the four slugs.
- **DB columns** on `project_personas`: `canonical_segment_id` (nullable, unique per project when set), `display_name`, `segment_description`, `segment_color_token` (cite-color allowlist).
- **Single resolver** merges mock segment rows with optional bound persona row for everything user-visible (titles, descriptions, dots, chat accents, denormalized persist fields for **new** messages).
- **Admin UI** on the dashboard Personas tab: segment binding + field editors, patterned after project documents (swatches, dialogs, validation).
- **Client app** fetches `project_personas`, renders **four** segment cards always, merges resolver output; threads resolved data through persona drawer, mobile drawer, and project chat.

## Scope (out / deferred)

- **Research-only mock fields** (survey n/pct, concern scores, voice quotes, suggested questions) stay in `MOCK_SEGMENT_PERSONAS` by canonical id until a later spec moves them to the DB.
- **Backfill** of historical chat rows when admin changes display after send — not required; snapshots on rows + “live” resolver for current UI is the intended split.

## Key decisions

| Topic | Decision |
| ----- | -------- |
| Segment identity | Keep four **slug** ids everywhere; no UUID migration for segment identity. |
| Binding cardinality | At most **one** `project_personas` row per project may bind a given canonical segment id (DB uniqueness). |
| Color tokens | Reuse **document cite-color** allowlist and app source of truth in `lib/theme/cite-color-tokens.ts`. |
| Resolution | Central **resolved segment view** for UI and persist; mock fills gaps when DB fields are null. |

## Technical context

- Storage and RLS baseline: [`supabase/migrations/202603311600_project_personas_storage.sql`](../../../supabase/migrations/202603311600_project_personas_storage.sql).
- Document display patterns: [`supabase/migrations/202604131600_project_documents_display_name.sql`](../../../supabase/migrations/202604131600_project_documents_display_name.sql), cite color migrations under `supabase/migrations/`.
- Theme maps: [`lib/theme/persona-segment-theme.ts`](../../../lib/theme/persona-segment-theme.ts), [`lib/theme/persona-chat-tone.ts`](../../../lib/theme/persona-chat-tone.ts).

## Success criteria (high level)

- Admin can bind a persona to a segment and edit display name, description, and color; conflicts show clear errors.
- Client Segments list and custom-audience UI show **resolved** labels and dot colors, including shades outside the original four-segment palette when allowed by cite tokens.
- New chat messages persist `persona_segment_name` / `persona_segment_color_token` consistent with what the user saw; custom-audience snapshots use resolver output.
