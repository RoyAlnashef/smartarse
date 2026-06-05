# Support email notifications — manual QA

## Prerequisites

- Migration `202606021200_support_email_notifications.sql` applied
- `EMAIL_PROVIDER_API_KEY` configured (see root README)
- `CRON_SECRET` set for cron route tests
- Signed in as dashboard **admin**

## Platform settings

1. Open `/settings/support-notifications` from the sidebar (**Support alerts**).
2. Confirm support email loads (default `smart-arse@disrupt-insight.com`).
3. Toggle each notification type off/on and save.
4. Reload page — settings persist.

## Per-project credit threshold

1. Open an admin project → **Settings → Credits**.
2. Set **Email support when balance below** (e.g. `50`) and save.
3. Clear the field and save — alerts disabled for that project.

## Low-credit email (manual)

1. Set a project threshold above current balance (e.g. threshold `100`, balance `95`) — no email yet if already below without crossing.
2. Add credits so balance is **at or above** threshold, then remove credits to cross below.
3. Run outbox cron:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/cron/support-notifications-outbox"
```

4. Confirm email to support inbox from dashboard **Support email** (or `DEMO_NOTIFICATION_EMAIL` env override for local/testing).
5. Re-run cron — no duplicate email while balance stays below threshold.
6. Add credits back to **≥ threshold** — crossing state clears; crossing again sends a new email.

## Access expiry email (manual)

1. Set a **live** project `access_until` to a UTC date exactly **28** or **14** days from today.
2. Run:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/cron/support-notifications"
```

3. Confirm one email per window (28d and 14d are separate).
4. Re-run cron — no duplicate for the same window.

## Toggle off

1. Disable the relevant toggle on `/settings/support-notifications`.
2. Re-run the appropriate cron — no new email; log row may still be written for expiry (sent with skipped delivery for credit outbox when toggle off marks sent without Resend — verify behavior in staging).
