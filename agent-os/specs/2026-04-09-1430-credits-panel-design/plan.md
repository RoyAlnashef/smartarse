# Credits panel design cleanup — execution plan

## Task 1: Spec documentation

Create this folder with `plan.md`, `shape.md`, `standards.md`, `references.md`, and `visuals/` (reference screenshot).

## Task 2: UI implementation

Edit [`app/(dashboard)/projects/[id]/page.tsx`](../../../app/(dashboard)/projects/[id]/page.tsx) — Credits `TabsContent`:

1. Move explanatory copy to the top of the card.
2. Style intro as a compact callout (muted background / border) with stronger text contrast.
3. Improve stat labels vs values; add separator before the add-credits form.

## Task 3: Verification

Admin → Project → Settings → Credits: reading order, contrast, add credits still works.

No backend or API changes.
