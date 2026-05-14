# References for Supabase Admin RLS + User/Org Create

## Similar Implementations

### Organizations dashboard wiring

- **Location:** `app/(dashboard)/organizations/page.tsx`
- **Relevance:** Current create/edit entry points and toast/error handling.
- **Key patterns to borrow:** page-level admin guard, data refresh after mutation.

### Organizations Supabase data layer

- **Location:** `lib/supabase/organizations.ts`
- **Relevance:** Existing browser-client create/update/list calls and current failure location.
- **Key patterns to borrow:** mapping between DB rows and UI types, slug generation loop.

### Users dashboard wiring

- **Location:** `app/(dashboard)/users/page.tsx`
- **Relevance:** Existing admin-only page gate and edit flow.
- **Key patterns to borrow:** modal open/edit handling, refresh after save, toast conventions.

### Users modal behavior

- **Location:** `components/users/user-form-modal.tsx`
- **Relevance:** Current Add User modal is informational only; edit is functional.
- **Key patterns to borrow:** role + organization form controls and loading state handling.

### Users Supabase update flow

- **Location:** `lib/supabase/users.ts`
- **Relevance:** Existing admin edit path for `public.users`.
- **Key patterns to borrow:** organization nulling for admin role and role normalization.

## Related prior spec

- **Location:** `agent-os/specs/2026-03-23-2200-supabase-orgs-crud-assignment/`
- **Relevance:** Established direction for replacing mock org/user management with Supabase-backed behavior.
