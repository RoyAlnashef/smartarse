# References for Disrupt Support Email Notifications

## Similar Implementations

### Demo access email (Resend)

- **Location:** `lib/demo-access/email.ts`, `lib/demo-access/config.ts`, `lib/demo-access/templates/shared.ts`
- **Relevance:** Reuse Resend client, From/Reply-To patterns, branded HTML layout
- **Key patterns:** `getFromAddressForRecipients()` for noreply→support inbox; `EMAIL_PROVIDER_API_KEY`

### Support notification recipient stub

- **Location:** `lib/support-notification-email.ts`, `lib/support-contact.ts`
- **Relevance:** Extend `getSupportNotificationEmail()` to read `platform_settings.support_email`; keep `DEMO_NOTIFICATION_EMAIL` env override for local testing

### Cron auth pattern

- **Location:** `app/api/cron/pause-expired-projects/route.ts`, `vercel.json`
- **Relevance:** Bearer `CRON_SECRET` for scheduled jobs; service-role Supabase client

### UTC access date math

- **Location:** `lib/project-status.ts`
- **Relevance:** `utcCalendarDaysUntil()` for 28d / 14d expiry windows aligned with Postgres `current_date`

### Credit billing (DB-side)

- **Location:** `supabase/migrations/202604132000_chat_results_project_credit_charge.sql`
- **Relevance:** Credit balance changes happen in Postgres trigger — crossing detection must also be DB-side

### Admin API guard

- **Location:** `lib/api/require-dashboard-admin.ts`, `app/api/admin/demo-requests/route.ts`
- **Relevance:** Platform settings GET/PATCH pattern

### Toggle UI pattern

- **Location:** `components/settings/notifications-section.tsx`, `components/settings/settings-block.tsx`
- **Relevance:** Three Switch rows with title + description for notification types

### Project credits settings

- **Location:** `app/(dashboard)/projects/[id]/page.tsx` (Credits tab)
- **Relevance:** Admin-only credit add/remove; add threshold field alongside existing controls

### Access lifecycle

- **Location:** `supabase/migrations/202604091200_projects_access_until.sql`, `app/api/cron/pause-expired-projects/route.ts`
- **Relevance:** `access_until` column and daily pause cron — expiry reminders are separate from pause

### Demo access spec (folder template)

- **Location:** `agent-os/specs/2026-05-19-1200-demo-access-flow/`
- **Relevance:** Spec folder structure and standards/references layout
