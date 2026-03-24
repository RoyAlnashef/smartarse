# References for Supabase Organizations + User Assignment

## Similar Implementations

### Organizations Dashboard Flow

- **Location:** `app/(dashboard)/organizations/page.tsx`
- **Relevance:** Existing organizations admin UX (table, filter/search, modal actions) to retain while swapping mock data for Supabase.
- **Key patterns:** Page-level state orchestration, modal open/edit lifecycle, handler-driven row updates.

### Organizations Table Component

- **Location:** `components/organizations/organization-table.tsx`
- **Relevance:** Current row rendering + action entrypoint for edit/delete behavior.
- **Key patterns:** Prop-driven callbacks for row actions, status display and list presentation.

### Organization Form Modal

- **Location:** `components/organizations/organization-form-modal.tsx`
- **Relevance:** Existing create/update form surface to connect to real mutations.
- **Key patterns:** Save payload shaping, edit-vs-create mode handling, validation UX.

### Users Dashboard Flow

- **Location:** `app/(dashboard)/users/page.tsx`
- **Relevance:** Assignment workflow target for `organization_id` updates.
- **Key patterns:** Page-level list/actions structure similar to organizations page; source of user edit actions.

### User Form Modal

- **Location:** `components/users/user-form-modal.tsx`
- **Relevance:** Current place where organization assignment controls are handled in the UI.
- **Key patterns:** Form-driven profile updates that can be extended to persist `organization_id`.

### Supabase Client Setup

- **Location:** `lib/supabase/client.ts`
- **Relevance:** Canonical browser Supabase client initialization and auth persistence behavior.
- **Key patterns:** Shared singleton client, env-based configuration, browser session continuity.

### Supabase Profile Read Pattern

- **Location:** `lib/supabase/fetch-user-profile.ts`
- **Relevance:** Existing example of typed `.from(...).select(...).maybeSingle()` query style.
- **Key patterns:** Lightweight read helper abstraction and error-safe query pattern.

### Domain Type Contracts

- **Location:** `lib/types.ts`
- **Relevance:** Central type source that must align with new Supabase field mappings.
- **Key patterns:** Shared entity contracts consumed by dashboard pages/components.

## Non-Code Operational References

- **`visuals/current-organizations-dashboard.jpg`** — current in-app organizations page with placeholder rows.
- **`visuals/supabase-organizations-table.jpg`** — source Supabase organizations table snapshot.

These visuals are implementation context only (what exists today), not prescriptive design comps.
