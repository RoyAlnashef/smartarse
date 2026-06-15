# Unified Demo + Login Entry — Shaping Notes

## Scope

Consolidate the public demo signup page and login page into a single entry at `/`:

- Split marketing + form layout from `/demo` becomes the canonical landing page at `/`
- Pink-bordered card gains two tabs: **Request demo access** (tab 1) and **Login** (tab 2)
- Login tab reuses full sign-in + forgot-password flow from the current login page
- `/demo` redirects to `/`

## Decisions

- **Routing:** `/` is canonical; `/demo` redirects to `/`
- **Login scope:** Full current flow — sign-in, forgot password, role-based redirect (admin → `/dashboard`, others → `/client/projects`)
- **Footer:** No `LegalFooterNav` on the unified page
- **Tabs:** Match control-panel primary tab styling (magenta `border-b-4` underline via Radix `Tabs`)
- **Deep links:** `?tab=login` opens Login tab; middleware adds this param when redirecting unauthenticated users

## Context

- **Visuals:** Demo page wireframe, current login form, control-panel Personas/Studio tabs (in `visuals/`)
- **References:** `components/demo-request-page.tsx`, `components/login-page.tsx`, `components/client/project-detail/project-sidebar-tabs.tsx`, `agent-os/specs/2026-06-03-1200-demo-signup-v2/`
- **Product alignment:** Public entry for demo requests and returning users; builds on demo signup v2 split layout

## Standards Applied

- **global/app-routing-protected-shell** — `/` entry, middleware redirects, auth gate
- **javascript/auth-rbac** — login flow, post-login redirects by role
- **css/ui-styling** — arse tokens, pill inputs, shadcn Tabs
- **global/project-conventions** — client components, `@/` imports, `cn()`
