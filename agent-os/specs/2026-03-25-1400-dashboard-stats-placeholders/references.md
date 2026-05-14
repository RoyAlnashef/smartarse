# References — Dashboard stats placeholders

## Similar implementations

### Stats bar (current pattern)

- **Location:** `components/dashboard/stats-bar.tsx`
- **Relevance:** Grid of metric cards, icon + value + label.
- **Key patterns:** `grid-cols-2 lg:grid-cols-4`, `rounded-xl border border-border bg-card`.

### Dashboard page shell

- **Location:** `app/(dashboard)/dashboard/page.tsx`
- **Relevance:** Title, subtitle, primary CTA, vertical spacing (`space-y-6`).

### Analytics page

- **Location:** `app/(dashboard)/analytics/page.tsx`
- **Relevance:** Optional reference for card density and chart-like regions when styling skeleton zones.

### Skeleton primitive

- **Location:** `components/ui/skeleton.tsx`
- **Relevance:** Pulse placeholders for list and chart areas.
