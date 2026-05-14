# References — Custom audience explore before save

Anchors are approximate; use search within files when line numbers drift.

## Primary implementation surfaces

### `components/client/project-detail/persona-drawer.tsx`

- **`applyCurrentAudienceDraft`** — applies draft to parent / chat; explore path does not require a typed name; preview display name uses auto-generator when the name field is empty.
- **`saveAudienceDraft`** — POST/PATCH saved audience; empty name on **create** uses parameter-based auto-name; updates still require a non-empty name; on successful **create** while a draft audience is applied, calls **`onPromoteDraftExploreThread`** so the explore thread becomes visible in history.
- **`saveAppliedDraftCustomAudience`** — POST from applied `draft-*` audience; calls **`onReplaceAppliedCustomAudience`** on success (no chat reset).
- **New vs edit footer** — **New:** stacked **Explore Audience** (full width), **Save Audience** (full width), **Cancel** (centered link). **Edit** (saved row): **Save Audience** and **Cancel** only. Save requires a typed name when editing; create allows empty name (auto-name).
- **`CustomAudienceLiveCard`** — optional **`draftActions`**: Save this audience, End session.
- **Applied-audience tab** — wiring for live card and draft-specific actions.

### `app/client/projects/[id]/page.tsx`

- **`handleApplyCustomAudience`** — clears thread and starts a new session when applying from the builder/list.
- **`handleReplaceAppliedCustomAudience`** — replaces **`appliedCustomAudience`** only (draft save from card); does not clear messages or rotate session; triggers **promote-draft** when replacing a draft with a saved row so the thread appears in history.
- **`promoteDraftExploreThread`** — `POST /api/chat/promote-draft-custom-audience-thread` after save when the anchor was a hidden draft explore thread.
- **`sendChatMessage`**, **`activeChatContextMode`** — `custom_audience` mode with denorm fields when a custom audience is applied (including draft ids in UI state; persist layer strips non-UUID ids).

### `lib/uuid-or-null-for-persist.ts`

- **`uuidOrNullForPersist`** — used by chat persist + webhook so non-UUID client ids never hit the DB or n8n as `custom_audience_id`.

### `lib/chat-restore-custom-audience.ts`

- **`ghostCustomAudienceFromChatRow`** — history restore when DB has null id but denorm present.
- **`isArchivedCustomAudienceId`** — synthetic **`archived:`** ids when the saved row is gone.
- **`isDraftCustomAudienceId`**, **`DRAFT_CUSTOM_AUDIENCE_ID_PREFIX`** — client temp **`draft-*`** ids (explore-before-save).

### `hooks/useChatQuestion.ts`

- **`postPersist`** (pending + final) — `custom_audience_id` via **`uuidOrNullForPersist`**; keep denorm + `chat_context_mode: "custom_audience"` when id is null; optional **`show_in_chat_history`** (false only for draft custom-audience explore on the project page).
- **Webhook `custom_audience` payload** — same UUID filtering for **`id`**.

### `app/api/chat/persist/route.ts`

- **`custom_audience_id`** must be UUID when present; FK to `project_custom_audiences`. Non-UUID draft ids must never be persisted.
- **`show_in_chat_history`** — optional body field (default true); false hides the row from client history until promoted.

### `app/api/chat/history/route.ts` · `lib/api/chat-history-server.ts`

- History list filters **`show_in_chat_history = true`** so draft explore threads stay out of the sidebar until save.

### `lib/supabase/projects.ts`

- **`fetchChatCountsByProject`** — counts only rows with **`show_in_chat_history`** true.

### `app/api/chat/promote-draft-custom-audience-thread/route.ts`

- Authenticated promotion: sets **`custom_audience_id`**, denormalized audience columns from **`project_custom_audiences`**, and **`show_in_chat_history: true`** for the anchor row when the user saves a draft explore session.

### `supabase/migrations/202605111800_chat_results_show_in_chat_history.sql`

- **`show_in_chat_history`** column on **`chat_results`** (default true).

### `supabase/migrations/202605072335_custom_audience_persistence_and_chat_metadata.sql`

- Schema reference for chat metadata columns and FK expectations.

- **`createSavedCustomAudience`** — verify uniqueness constraints and align auto-name collision strategy.

## UX / patterns

### `components/client/project-detail/project-chat.tsx`

- Icon and CTA patterns for alignment with Explore / Save actions in the drawer footer.

### `components/client/project-detail/mobile-persona-drawer.tsx`

- Pass-through props for parent callbacks (`onReplaceAppliedCustomAudience`, **`onPromoteDraftExploreThread`**, etc.).

### `components/client/project-detail/project-sidebar-tabs.tsx`

- Pass-through props for drawer / panel wiring.

## Related shaping specs

- [2026-05-08-0556-custom-audience-detail](../2026-05-08-0556-custom-audience-detail/) — prior custom audience detail / builder references and visuals.
