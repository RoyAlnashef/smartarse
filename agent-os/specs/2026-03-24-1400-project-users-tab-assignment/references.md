# References — Project Users tab

## Primary implementation surface

- **`app/(dashboard)/projects/[id]/page.tsx`** — Tab definitions (`tabs`, `visibleTabs` with `adminOnly`), tab content branches for `chat`, `uploads`, `settings`; pattern for new `users` branch.

## Domain types and data

- **`lib/types.ts`** — `Project` (`assignedUserIds`, `clientId`, `clientName`), `User` (`clientId`, `role`, `status`).
- **`lib/mock-data.ts`** — `users`, `projects` seed rows for assignments and org linkage.

## Layout/styling patterns

- **Settings tab** in the same page — `max-w-2xl` form sections, card borders, primary action footer.
- **`agent-os/standards/css/ui-styling.md`** — semantic tokens and input focus classes.
