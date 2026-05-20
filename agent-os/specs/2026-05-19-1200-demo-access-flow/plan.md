# Demo Access Flow — Magic-Link Approval

Execution plan. Shaping in [`shape.md`](shape.md). Standards in [`standards.md`](standards.md). Code pointers in [`references.md`](references.md).

Supersedes [`agent-os/specs/2026-04-02-1200-demo-magic-link-approval/`](../2026-04-02-1200-demo-magic-link-approval/).

## Tasks

1. **Spec documentation** — this folder
2. **Database** — `demo_access_requests` + RLS + demo org seed
3. **Server modules** — `lib/demo-access/*` (tokens, provision, email, requests)
4. **Public signup** — `/demo` + `POST /api/demo/request`
5. **Email actions** — `GET /api/demo/approve` + `reject` (HTML pages)
6. **Admin dashboard** — `/demo-requests` + admin APIs + sidebar nav
7. **First login** — `/auth/callback` + `POST /api/demo/record-first-login`
8. **Stale cleanup** — cron + `expire_pending_demo_access_requests` RPC
9. **Config & QA** — README env, redirect URLs, smoke checklist

See attached implementation plan in Cursor for full task detail and decisions.
