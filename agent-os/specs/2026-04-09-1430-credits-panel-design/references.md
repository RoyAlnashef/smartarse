# References — Credits panel design

## Primary implementation

- **Location:** [`app/(dashboard)/projects/[id]/page.tsx`](../../../app/(dashboard)/projects/[id]/page.tsx) — `TabsContent value="credits"`.
- **Relevance:** Single source for admin credits top-up UI and copy.

## Related patterns

- **Location:** [`components/settings/billing-usage-section.tsx`](../../../components/settings/billing-usage-section.tsx)
- **Relevance:** Similar “total / used” style summary elsewhere in settings; optional consistency reference.

## Meter (out of scope for this spec)

- **Location:** [`components/dashboard/project-credits-meter.tsx`](../../../components/dashboard/project-credits-meter.tsx)
- **Relevance:** Compact credits display in header/cards; not modified by this design pass.
