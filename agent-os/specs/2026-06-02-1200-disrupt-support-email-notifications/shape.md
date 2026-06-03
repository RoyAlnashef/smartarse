# Disrupt Support Email Notifications — Shaping Notes

## Scope

Automated emails to the Disrupt support inbox when client projects need ops attention:

1. **Low credit balance** — once per threshold crossing (re-alerts after balance restored ≥ threshold, then drops below again)
2. **Access expires in 4 weeks** — live projects with `access_until` set
3. **Access expires in 2 weeks** — same eligibility

Platform-wide toggles and support email address are **dashboard-admin only**. Per-project config is limited to the **credit alert threshold**.

## Decisions

| Topic | Decision |
|-------|----------|
| Recipients | Disrupt support inbox (default `smart-arse@disrupt-insight.com`) |
| Org overrides | None — client orgs cannot override email or toggles |
| Credit alert timing | DB trigger on `credit_balance` change + 15m outbox cron (not synchronous in chat routes) |
| Credit threshold | Per project, nullable integer on `projects.credit_alert_threshold` |
| Expiry windows | 28 and 14 UTC calendar days before `access_until`; live projects only |
| Email provider | Resend — reuse existing demo-access integration |
| Admin UI | `/settings/support-notifications` (admin only); threshold on project Credits tab |
| Client `/settings` toggles | Out of scope (mock UI only today) |

## Context

- **Visuals:** Match `SettingsBlock` + `NotificationsSection` toggle pattern — see [`visuals/README.md`](visuals/README.md)
- **References:** [`references.md`](references.md)
- **Product alignment:** Ops visibility for credits & access lifecycle ([`mission.md`](../../product/mission.md))

## Standards Applied

- `javascript/auth-rbac` — admin-only settings surfaces
- `global/app-routing-protected-shell` — new dashboard route under `(dashboard)`
- `global/project-conventions` — UI patterns, sonner toasts
- Cron auth pattern from `app/api/cron/pause-expired-projects/route.ts`
