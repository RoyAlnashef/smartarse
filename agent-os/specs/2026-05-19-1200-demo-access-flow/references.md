# References for Demo Access Flow

## Similar Implementations

### Login page (public UI)

- **Location:** `components/login-page.tsx`, `components/login-flow-background.tsx`
- **Relevance:** Visual/layout reference for `/demo` signup
- **Key patterns:** `LoginFlowBackground`, rounded inputs, footer links

### Admin user provisioning

- **Location:** `app/api/admin/users/route.ts`
- **Relevance:** `admin_provisioned` + `public.users` upsert with `organization_id`
- **Key patterns:** Service-role `createUser`, rollback on profile failure

### Auth trigger skip

- **Location:** `supabase/migrations/202603281000_auth_users_drop_all_custom_triggers_and_harden_skip.sql`
- **Relevance:** Demo users must not auto-create orgs

### Dashboard admin guard

- **Location:** `lib/api/require-dashboard-admin.ts`
- **Relevance:** Admin list/approve/reject APIs

### Cron pattern

- **Location:** `app/api/cron/pause-expired-projects/route.ts`, `vercel.json`
- **Relevance:** Bearer `CRON_SECRET` for scheduled expiry

### Support contact

- **Location:** `lib/support-contact.ts`
- **Relevance:** Notification recipient until settings page exists

### Prior shaping (historical)

- **Location:** `agent-os/specs/2026-04-02-1200-demo-magic-link-approval/`
- **Relevance:** Earlier minimal scope; superseded by this spec
