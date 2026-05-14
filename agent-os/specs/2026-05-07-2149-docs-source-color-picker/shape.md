# Docs Source Color Picker — Shaping Notes

## Scope

Upgrade document source-color selection to support both quick preset swatches and an advanced picker interaction (saturation/value + hue + alpha), with docs surface integrated first and reusable primitives for follow-up surfaces.

## Decisions

- Keep existing swatch tokens and "Use default color" flow.
- Introduce a reusable advanced color picker in `components/ui/`.
- Use advanced picker for interaction parity with the provided reference while preserving current modal shell and callback behavior.
- Integrate first in the Project Documents source-color modal to reduce rollout risk.

## Context

- **Visuals:** Target style and current baseline screenshots supplied by user.
- **References:** `components/upload/sortable-project-documents-table.tsx`, `app/(dashboard)/projects/[id]/page.tsx`.
- **Product alignment:** Supports roadmap design polish and reusable component direction while preserving current data contracts.

## Standards Applied

- `css/ui-styling` — new primitive under `components/ui/`, semantic tokens, `cn()`, and consistent focus/radius patterns.
