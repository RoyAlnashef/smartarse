# Demo Access Flow — Shaping Notes

## Scope

Full demo access lifecycle per [`agent-os/product/notes-archive/demo-access-flow-spec.md`](../../product/notes-archive/demo-access-flow-spec.md):

- Public email signup (`/demo`, login-styled UI)
- Disrupt notification to support inbox with signed approve/reject links
- Supabase magic-link provisioning into the **admin-designated demo project** (that project's org + `project_users`)
- Direct entry to `/client/projects/[id]` — no project list for demo users
- Admin dashboard at `/demo-requests`
- `first_login_at` tracking
- Stale pending request expiry via cron

## Decisions

| Topic | Decision |
|-------|----------|
| Demo project config | Admin UI only: **Use as demo project** in project settings (`projects.is_demo`, one at a time) |
| Re-submit after reject | New row if no active `pending` for email |
| Magic link expiry | Supabase default (~1 hour) |
| Admin nav | **Demo requests** → `/demo-requests` (admin only) |
| Expired requests | `status = expired`, rows retained |
| Demo user role | `user` in the **demo project's organization** (Option A — org under the hood for RLS/chat) |
| Notification (v1) | `DEMO_NOTIFICATION_EMAIL` or footer support email via `getSupportNotificationEmail()` |

## Context

- **Visuals:** Reuse login page layout — see [`visuals/README.md`](visuals/README.md)
- **References:** [`references.md`](references.md)
- **Product alignment:** Controlled, project-centric entry; demo users skip org/list UX ([`mission.md`](../../product/mission.md))

## Standards Applied

- `javascript/auth-rbac` — demo user role/org; admin-only dashboard
- `global/developer-guide` — Supabase service role server-side only
- `global/app-routing-protected-shell` — public `/demo`; dashboard under `(dashboard)`
- `css/ui-styling` — login tokens for public page; shadcn for admin table
- `global/project-conventions` — `@/` imports, `cn()`, sonner toasts
