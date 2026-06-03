# Disrupt Support Email Notifications — Execution Plan

Implementation plan. Shaping in [`shape.md`](shape.md). Standards in [`standards.md`](standards.md). Code pointers in [`references.md`](references.md).

Cursor working spec: [`.cursor/plans/disrupt_support_email_estimate_be9bd6f6.plan.md`](../../../.cursor/plans/disrupt_support_email_estimate_be9bd6f6.plan.md).

## Tasks

1. **Spec documentation** — this folder
2. **Database** — `platform_settings`, `projects.credit_alert_threshold`, `support_notification_log`, credit crossing trigger + RLS
3. **Send helper + templates** — `lib/support-notifications/*`; reuse demo-access Resend stack; extend `getSupportNotificationEmail()`
4. **Platform admin settings** — `GET/PATCH /api/admin/platform-settings` + `/settings/support-notifications` + sidebar link
5. **Project credit threshold** — Credits tab field + `ProjectRow` mapping
6. **Credit notification pipeline** — outbox cron (15m) + optional evaluate API after admin credit RPCs
7. **Expiry notification cron** — daily `/api/cron/support-notifications` for 28d / 14d windows
8. **Tests + docs** — Vitest for date/dedupe helpers; README env section; manual QA checklist

## Architecture summary

- **Credit alerts:** `AFTER UPDATE OF credit_balance` trigger queues `pending` rows in `support_notification_log`; 15m outbox cron sends via Resend.
- **Expiry alerts:** daily cron checks live projects at 28d / 14d before `access_until` (UTC calendar).
- **Settings:** singleton `platform_settings` (support email + three toggles); per-project `credit_alert_threshold` only.
- **Delivery:** reuse `lib/demo-access` Resend config (`EMAIL_PROVIDER_API_KEY`, noreply→support From pattern).
