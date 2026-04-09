# Demo magic-link approval — Shaping notes

## Scope

Disrupt wants a **demo** version of smartA.R.S.E. advertised on the company website. Signup should feel like a **magic link**, but each request is **manually approved** so the team can screen competitors.

- Requester submits email → **email to Disrupt** with the requester’s address and a **button** to approve.
- On approve → **magic link** is sent to the requester; they complete login and land in a **shared demo organization** with a demo project list and normal smartA.R.S.E. interaction.
- **Analytics (v1, minimal):** Persist enough in the database to know **when the link was sent** and **when the user first logged in**; **admin dashboard** surfaces this per request/link.

## Decisions

- **Demo org model:** Single shared **Demo** organization—all approved users get the same `organization_id` and see the same demo project(s).
- **Analytics depth (v1):** **Minimal** — track **magic link sent** and **first login** timestamps (not full funnel UI, not email-open tracking).
- **Public UI:** Replicate the **current login page** styling for the demo signup page; adjust form fields and copy (email-only + success messaging).
- **Approve UX:** Prefer **signed link in email** so Disrupt does not need to log into the app to approve (can add in-dashboard confirmation later).

## Context

- **Visuals:** No separate mockups — align with existing login look and feel (see [`visuals/README.md`](visuals/README.md)).
- **References:** Admin user creation + `admin_provisioned`, auth trigger skip, login page, `requireDashboardAdmin` — see [`references.md`](references.md).
- **Product alignment:** Matches [`agent-os/product/mission.md`](../../product/mission.md): controlled, org-scoped workspace; demo is a gated entry path, not open self-serve org creation.

## Standards applied

- **javascript/auth-rbac** — Demo users need a concrete role and org; admin-only analytics UI.
- **global/developer-guide** — Supabase auth/DB boundaries, service role only server-side, `organization_id` for chat payloads.
- **global/app-routing-protected-shell** — New public demo route outside dashboard shell; dashboard list under `(dashboard)` with page-level admin gate.
