# Credits panel design — shaping notes

## Scope

Polish the Project Settings → Credits card: stronger contrast between labels, values, and sections; move informational copy out of the middle of the panel so flow is context → balance → action.

## Decisions

- **Informational text:** At the **top** of the card only (no tooltip).
- **Implementation:** Inline in `page.tsx` (no component extraction in this pass).
- **No** API, Supabase, or credit logic changes.

## Context

- **Visuals:** `visuals/before-reference.png` — prior layout (stats, then gray paragraph, then form).
- **References:** Credits block in `app/(dashboard)/projects/[id]/page.tsx`; optional pattern reference `components/settings/billing-usage-section.tsx`.
- **Product alignment:** Per-project credit budget remains clear for admins; billing behavior unchanged.

## Standards applied

- `css/ui-styling` — semantic tokens, existing form/button patterns on the same page.
