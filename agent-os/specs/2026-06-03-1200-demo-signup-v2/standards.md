# Standards for Demo Signup v2

The following standards apply to this work.

---

## css/ui-styling

**Why it applies:** Public `/demo` and `/auth/demo-setup` use login brand tokens (`arse-pink`, `arse-cyan`, `font-arse-*`, pill inputs, `LoginFlowBackground`); admin table uses shadcn primitives.

_Full source:_ [`agent-os/standards/css/ui-styling.md`](../../standards/css/ui-styling.md)

---

## global/app-routing-protected-shell

**Why it applies:** `/demo` and `/auth/demo-setup` are public routes; `/demo-requests` stays under `(dashboard)` with page-level admin gate.

_Full source:_ [`agent-os/standards/global/app-routing-protected-shell.md`](../../standards/global/app-routing-protected-shell.md)

---

## global/project-conventions

**Why it applies:** `@/` imports, `cn()`, sonner toasts on dashboard actions, existing form/card patterns.

_Full source:_ [`agent-os/standards/global/project-conventions.md`](../../standards/global/project-conventions.md)

---

## javascript/auth-rbac

**Why it applies:** Demo users retain `demo_user` + org assignment; password setup uses session from activation link; admin APIs remain dashboard-admin only; callback guard for `requires_password_setup`.

_Full source:_ [`agent-os/standards/javascript/auth-rbac.md`](../../standards/javascript/auth-rbac.md)

---

## global/developer-guide

**Why it applies:** Server routes, Resend email, Supabase Admin for provision and password-setup flag clearing; service role never in browser.

_Full source:_ [`agent-os/standards/global/developer-guide.md`](../../standards/global/developer-guide.md)

Key constraints: `SUPABASE_SERVICE_ROLE_KEY` server-only; demo users scoped by demo project's `organization_id`; extend existing `lib/demo-access/*` modules rather than parallel implementations.
