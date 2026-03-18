# Sign-in + client theme — Shaping notes

## Scope

- **Sign-in:** One new themed page (cyan/magenta, centered layout, pill inputs, footer links). Replaces the previous Disrupt split-screen login entirely.
- **Theme:** Establish tokens and typography for “client surface” + login; admin dashboard UI unchanged.
- **Client landing:** Themed **project list** at `/client/projects` (wireframe). Project detail full build deferred; optional placeholder route under `(client)` so clients do not enter admin shell.
- **Routing:** After mock login — admin → `/dashboard`; client / end-user → `/client/projects`. Root page must send already-authenticated users to the correct destination by role.

## Decisions

- No authentication backend in this spec.
- Admin and client share the **same** sign-in screen; experience diverges **after** login.
- Project list / detail mockups inform layout and theme; only list (and minimal placeholder detail if included) is implemented now.

## Context

- **Visuals:** `visuals/login-*.png` (new sign-in target), `visuals/project-list-*.png`, `visuals/project-detail-*.png` (reference for later).
- **References:** See [references.md](./references.md).
- **Product alignment:** smartA.R.S.E. client vs admin personas per `agent-os/product/mission.md`.

## Standards applied

- **css/ui-styling** — layers, `cn()`, tokens; client theme adds parallel tokens without breaking dashboard semantics.
- **global/app-routing-protected-shell** — route groups, auth gates, `router.replace` for redirects.

## Palette & type (implementation targets)

| Token | Value |
|-------|--------|
| Vivid Cyan | `#00ffff` |
| Vivid Magenta | `#ff0099` |
| Black / White | `#000000` / `#ffffff` |

| Use | Font |
|-----|------|
| “smart” wordmark | Vintage Goods (self-hosted) |
| A.R.S.E, titles, tagline | Raleway (Google) |
| Body, cards, UI copy | DM Sans (Google) |
