# Personas right column — Shaping notes

## Scope

- **Client** project detail (`/client/projects/[id]`): replace the **desktop** in-chat Personas **drawer + overlay** with a **fixed third column** in the page grid (**1 : 2 : 1**).
- **Remove** floating drawer and **X** close from the **desktop** personas chrome; personas are a **collapsible** layout column (narrow **~48px rail** when collapsed, chevron / label to expand).
- **Below `lg`:** keep **overlay drawer** (backdrop + slide-in), **closed by default** (same idea as current `matchMedia` behavior).
- **Default tab:** **Segments** (unchanged — `defaultValue="segments"` in tabs).

## Decisions

| Decision | Choice |
|----------|--------|
| Desktop layout | Page-level **3-column** grid; chat **no longer** overlapped by Personas. |
| Collapsed desktop | **Narrow vertical rail** (~48px) with affordance to expand. |
| Mobile | **Drawer only** on small screens; **not** the new 3-column layout. |
| State ownership | **`appliedPersonaId`** (and apply/clear) lifted to **`ClientProjectDetailPage`** so chat + personas share one source of truth. |
| Close on mobile | Backdrop + **explicit dismiss** in mobile header (personas still need a way to close on touch). |

## Context

- **Visuals:** `visuals/00-reference-current-ui.png` — reference for **before** state (Personas as overlay on chat). Target is column + no overlay on desktop.
- **References:** See [`references.md`](references.md).
- **Product alignment:** Project-centric client workspace; personas remain mock/UI until agent integration ([`agent-os/product/mission.md`](../../product/mission.md)).

## Standards applied

- `css/ui-styling` — Feature components under `components/client/project-detail/`, `cn()`, Radix tabs via `@/components/ui/*`.
- `global/project-conventions` — `@/` imports, `"use client"` where needed, smartA.R.S.E. copy.
