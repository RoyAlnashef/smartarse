# Persona drawer in client chat — Plan

## Goal

Add an **open-by-default** right-side drawer **inside** the client Project Detail AI chat window (`/client/projects/[id]`), with a close button, tabbed panes (Segments / Audience / Focus Group), mock segment list, and mock “persona applied” UI (pinned alert + detail card). **Front-end only** until client approves; no research agent or API integration in this slice.

## Non-goals (this iteration)

- Persisting selected persona, webhook payloads, or Supabase fields.
- Real segment/audience/focus-group data from backend.
- Changing admin dashboard chat (`app/(dashboard)/projects/[id]`).

## Visuals

See `visuals/README.md` and PNGs in `visuals/`.

- Tailwind UI drawer reference: [Drawers — Tailwind Plus](https://tailwindcss.com/plus/ui-blocks/application-ui/overlays/drawers)

---

## Task 1: Save spec documentation

Done — this folder contains `plan.md`, `shape.md`, `standards.md`, `references.md`, and `visuals/`.

## Task 2: Add `PersonaDrawer` component

- New file: `components/client/project-detail/persona-drawer.tsx`
- Header + **close** control; `w-96` drawer column on desktop.
- Radix tabs via `components/ui/tabs.tsx` with ARSE-themed class overrides.
- **Segments**: mock cards (title, description, survey line, “+ Interview voices”).
- **Audience** / **Focus Group**: empty states.
- When a persona is “applied”: show **detail card** in drawer (metrics, sections, suggested prompts optional).

## Task 3: Wire into `ProjectChat`

**Done** — `components/client/project-detail/project-chat.tsx`:

- **Flex layout** inside the magenta-bordered section: chat column (`flex-1 min-w-0`) + `PersonaDrawer` (`lg:w-96`).
- State: `drawerOpen` (default `true`; on first mount, below `1024px` sets `false`), `appliedPersonaId` → resolved `appliedPersona` from `MOCK_SEGMENT_PERSONAS`.
- **Pinned alert** (`PersonaPinnedAlert`) above messages when a persona is applied; input **placeholder** uses segment title.
- **Reopen** control when the drawer is closed: “Persona panel” button with `Users` icon.

## Task 4: Responsive pass

- Desktop (`lg+`): drawer open by default; close hides drawer and chat expands.
- Smaller breakpoints: drawer hidden or stacked so chat remains usable (tune after QA).

## Task 5: Local QA

- `/client/projects/p1`: drawer visible by default (desktop), tabs work, Segments list visible, selecting a segment shows alert + detail; close hides drawer.
