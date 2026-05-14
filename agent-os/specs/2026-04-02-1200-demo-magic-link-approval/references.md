# References for demo magic-link approval

## Similar implementations

### Admin user provisioning API

- **Location:** [`app/api/admin/users/route.ts`](../../../app/api/admin/users/route.ts)
- **Relevance:** Pattern for service-role `createUser` with `admin_provisioned` and `public.users` upsert including `organization_id`.
- **Key patterns:** Zod body validation, `requireDashboardAdmin`, rollback on `users` upsert failure.

### Auth user trigger (skip default org)

- **Location:** [`supabase/migrations/202603281000_auth_users_drop_all_custom_triggers_and_harden_skip.sql`](../../../supabase/migrations/202603281000_auth_users_drop_all_custom_triggers_and_harden_skip.sql)
- **Relevance:** Approved demo users must not get a new org from `handle_new_user`; same `admin_provisioned` skip as admin-created users.
- **Key patterns:** `raw_app_meta_data` / `raw_user_meta_data` checks for `admin_provisioned`.

### Login page UI baseline

- **Location:** [`components/login-page.tsx`](../../../components/login-page.tsx)
- **Relevance:** Visual and layout reference for the public demo request page.
- **Key patterns:** Form layout, error states, Supabase client usage for email flows (reset password today; magic link will be new).

### Dashboard admin API guard

- **Location:** [`lib/api/require-dashboard-admin.ts`](../../../lib/api/require-dashboard-admin.ts)
- **Relevance:** Any admin-only read API for `demo_access_requests` should reuse this guard.
- **Key patterns:** Session + optional Bearer token, role check, service-role client return.
