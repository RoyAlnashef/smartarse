# Docs Source Color Picker Spec

## Goal

Adopt a color-selection UX closer to the first screenshot (advanced picker interaction) while preserving existing project-doc source-color behaviors and maintaining current presets/default-color flow.

## Scope

- Build a reusable color picker component that supports:
  - saturation/value area
  - hue control
  - alpha control
  - live preview and selection state
- Keep existing preset swatches and "Use default color" behavior.
- Integrate in Project Documents source-color modal first.
- Preserve existing persistence callback contract (`onSaveCiteColor`) for this first iteration.

## Key Context

- Current source-color modal implementation lives in [components/upload/sortable-project-documents-table.tsx](/Users/royalnashef/Desktop/smart-arse/components/upload/sortable-project-documents-table.tsx).
- Project page integration entry point is [app/(dashboard)/projects/[id]/page.tsx](/Users/royalnashef/Desktop/smart-arse/app/(dashboard)/projects/[id]/page.tsx).
- Relevant style standard: [agent-os/standards/css/ui-styling.md](/Users/royalnashef/Desktop/smart-arse/agent-os/standards/css/ui-styling.md).
- Product alignment (design polish + reusable UI): [agent-os/product/mission.md](/Users/royalnashef/Desktop/smart-arse/agent-os/product/mission.md), [agent-os/product/roadmap.md](/Users/royalnashef/Desktop/smart-arse/agent-os/product/roadmap.md), [agent-os/product/tech-stack.md](/Users/royalnashef/Desktop/smart-arse/agent-os/product/tech-stack.md).
- Visual inputs:
  - target style: `/Users/royalnashef/.cursor/projects/Users-royalnashef-Desktop-smart-arse/assets/image-ba03740f-bbcf-47a7-9d3d-9a879850a009.png`
  - current modal baseline: `/Users/royalnashef/.cursor/projects/Users-royalnashef-Desktop-smart-arse/assets/image-ba8fbe09-6642-474c-bce7-550e5a03d04e.png`
  - in-app context: `/Users/royalnashef/.cursor/projects/Users-royalnashef-Desktop-smart-arse/assets/image-78346f59-2af9-430a-8613-88ca8a49465e.png`

## Tasks

### Task 1: Save spec documentation

Create `agent-os/specs/2026-05-07-2149-docs-source-color-picker/` with:

- `plan.md` (this plan)
- `shape.md` (scope, decisions, context)
- `standards.md` (applied standards content)
- `references.md` (existing implementation references)
- `visuals/` (reference images)

### Task 2: Implement reusable advanced picker primitive

- Add a reusable UI component under `components/ui/` (per `css/ui-styling`) for advanced color selection.
- Keep component API composable so feature dialogs can combine advanced controls + fixed swatches.
- Include keyboard/focus affordances and aria labels consistent with current modal accessibility patterns.

### Task 3: Compose presets + advanced picker in source-color modal

- Refactor the source-color dialog in [components/upload/sortable-project-documents-table.tsx](/Users/royalnashef/Desktop/smart-arse/components/upload/sortable-project-documents-table.tsx) to include:
  - existing palette swatches (still first-class)
  - advanced picker section inspired by screenshot 1
  - default-reset action
- Preserve current document-target context text and modal shell behavior.
- Keep save semantics backward-compatible for docs surface.

### Task 4: Integration hardening and rollout prep

- Verify dialog interactions in [app/(dashboard)/projects/[id]/page.tsx](/Users/royalnashef/Desktop/smart-arse/app/(dashboard)/projects/[id]/page.tsx) (open, select, save, reset, close).
- Add/adjust light unit or interaction tests if existing coverage exists for this area.
- Document a follow-up checklist to roll the reusable picker into other color-edit surfaces later.

## Acceptance Criteria

- Source-color modal supports both quick presets and advanced picker controls.
- Existing default-color and save flows still work.
- Styling follows `css/ui-styling` conventions and does not regress current modal usability.
- Reusable picker foundation is ready for additional surfaces after docs-first rollout.

## Risks to watch

- Mapping freeform picker output to existing token-based storage for current backend contracts.
- Avoiding visual mismatch with existing dialog system in dark/light themes.
- Ensuring keyboard accessibility for non-native slider/drag regions.
