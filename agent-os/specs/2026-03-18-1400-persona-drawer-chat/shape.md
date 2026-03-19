# Persona drawer in client chat — Shaping notes

## Scope

- Right-side **in-chat** drawer on the **client** project detail page (route `/client/projects/[id]`, component `ProjectChat`).
- **Open by default**; **close** hides the drawer so the chat column uses full width.
- Three tabs: **Segments**, **Audience**, **Focus Group** — only Segments populated with **static mock** segment personas; other two panes empty.
- After “apply” (mock): **pinned alert** in the chat stream area + **persona detail card** in the drawer, per reference screenshots.
- UI-only; agent integration deferred until client sign-off.

## Decisions

| Decision | Choice |
|----------|--------|
| Where it lives | Client project detail chat only (`ProjectChat`), not dashboard chat. |
| Close behavior | Hides drawer; chat expands (no minimize rail in v1). |
| Segments data | Hardcoded mock list matching reference copy/structure. |
| Drawer width (desktop) | `w-96` (~384px). |
| Types | Keep `PersonaMock` local to drawer until integration; then move to `lib/types.ts`. |
| Tabs implementation | Reuse `components/ui/tabs` (Radix) with theme overrides. |
| Drawer pattern | In-panel split layout inspired by [Tailwind Plus drawers](https://tailwindcss.com/plus/ui-blocks/application-ui/overlays/drawers), not necessarily `vaul` overlay for desktop. |

## Context

- **Visuals:** `visuals/01-*.png` … `03-*.png` (see `visuals/README.md`).
- **References:** `references.md`.
- **Product alignment:** Project-centric research chat; persona mode will later tie to n8n/webhook + org-scoped payloads (see `agent-os/product/tech-stack.md`).

## Standards applied

- `css/ui-styling` — primitives, `cn`, feature folder placement.
- `global/project-conventions` — `@/` imports, client boundaries.
