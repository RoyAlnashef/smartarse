# Client Project Detail (Front-end) — Plan

## Goal

Implement the **client-facing Project Detail** screen at `app/client/projects/[id]/page.tsx` to match the provided mock, including:

- Left rail: **Project Detail** card + **Sources** selector.
- Main panel: chat messages + input.
- Mock interactions: toggle sources, send messages, append messages to a single active chat thread.
- Responsive + a11y pass: usable on mobile/tablet, keyboard/focus states.

## Non-goals (this iteration)

- Real backend/API, streaming, real credit decrement.
- Chat history list / multi-thread conversations.

## Visuals

- `visuals/project-detail-d65f8e9f-8542-44c4-92a6-f17dc32071e5.png`

---

## Task 1: Save Spec Documentation

Create `agent-os/specs/2026-03-17-1545-client-project-detail/` with:

- `plan.md` — this plan
- `shape.md` — shaping notes
- `standards.md` — relevant standards content
- `references.md` — pointers to reference implementations
- `visuals/` — design mock(s)

## Task 2: Implement client project detail UI shell

- Replace placeholder in `app/client/projects/[id]/page.tsx` with the two-column layout + left rail + chat canvas.
- Ensure styles align with project list’s client theme (`arse-*` tokens and typography).

## Task 3: Add mock interactions (sources + chat)

- Source selection toggles; selection stored in state.
- Chat send flow: append user message + simulated assistant response.
- Single thread only for now.

## Task 4: Responsive + accessibility pass

- Mobile/tablet layout rules for left rail vs chat.
- Keyboard navigation, focus states, aria labels where appropriate.

## Task 5: Quick UI QA checklist (local)

- Route `/client/projects/p1` renders correctly (project exists).
- Missing project state is on-brand and has a back link to `/client/projects`.
- Narrow width behavior is usable; chat input is reachable and focusable.

