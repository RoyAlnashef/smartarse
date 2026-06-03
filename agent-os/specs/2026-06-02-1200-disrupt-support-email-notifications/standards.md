# Standards for Disrupt Support Email Notifications

The following standards apply to this work.

---

## javascript/auth-rbac

**Why it applies:** Platform notification settings and project credit threshold are admin-only; cron routes use service role server-side.

_Full source:_ [`agent-os/standards/javascript/auth-rbac.md`](../../standards/javascript/auth-rbac.md)

---

## global/developer-guide

**Why it applies:** Resend email, Supabase Admin client for crons and platform settings API; service role never in browser.

_Full source:_ [`agent-os/standards/global/developer-guide.md`](../../standards/global/developer-guide.md)

Key constraints: `SUPABASE_SERVICE_ROLE_KEY` server-only; platform settings via `/api/admin/platform-settings` with `requireDashboardAdmin`.

---

## global/app-routing-protected-shell

**Why it applies:** `/settings/support-notifications` lives under `(dashboard)` with page-level admin gate.

_Full source:_ [`agent-os/standards/global/app-routing-protected-shell.md`](../../standards/global/app-routing-protected-shell.md)

---

## global/project-conventions

**Why it applies:** `@/` imports, `SettingsBlock`, `Switch`, sonner toasts on save actions.

_Full source:_ [`agent-os/standards/global/project-conventions.md`](../../standards/global/project-conventions.md)
