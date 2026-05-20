# Standards for Demo Access Flow

The following standards apply to this work.

---

## javascript/auth-rbac

**Why it applies:** Demo users need role + `organization_id`; admin dashboard is admin-only; magic-link completion uses the same `User` model.

_Full source:_ [`agent-os/standards/javascript/auth-rbac.md`](../../standards/javascript/auth-rbac.md)

---

## global/developer-guide

**Why it applies:** Server routes, Resend email, Supabase Admin; service role server-only.

_Full source:_ [`agent-os/standards/global/developer-guide.md`](../../standards/global/developer-guide.md)

Key constraints: `SUPABASE_SERVICE_ROLE_KEY` never in browser; demo users scoped by `organization_id`; admin APIs role-gated.

---

## global/app-routing-protected-shell

**Why it applies:** `/demo` is public; `/demo-requests` is under `(dashboard)` with page-level admin gate.

_Full source:_ [`agent-os/standards/global/app-routing-protected-shell.md`](../../standards/global/app-routing-protected-shell.md)

---

## css/ui-styling

**Why it applies:** Public page uses login brand tokens; admin table uses shadcn primitives.

_Full source:_ [`agent-os/standards/css/ui-styling.md`](../../standards/css/ui-styling.md)

---

## global/project-conventions

**Why it applies:** `@/` imports, `cn()`, sonner toasts on dashboard actions.

_Full source:_ [`agent-os/standards/global/project-conventions.md`](../../standards/global/project-conventions.md)
