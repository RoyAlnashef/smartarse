# Dashboard layout (placeholders) + stat bar redesign

## Task 1: Spec documentation

This folder holds shaping artifacts for the dashboard refresh. Visual baseline: `visuals/baseline-dashboard-four-stats.png`.

## Task 2: Stat bar

Replace the four tiles in `components/dashboard/stats-bar.tsx` with **Projects**, **Queries**, **Users**, and **Organizations** using placeholder integers and `// TODO: wire Supabase` comments per metric.

## Task 3: Placeholder zones

Add `components/dashboard/dashboard-overview-placeholder.tsx`: primary row (recent activity list skeleton + queries trend placeholder), secondary row (quick links to `/projects`, `/users`, `/organizations`, `/analytics`).

## Task 4: Page copy

Update `app/(dashboard)/dashboard/page.tsx` subtitle to match new metrics; compose `StatsBar` + overview placeholder.

## Phase 2 (deferred)

Wire counts from Supabase (`projects`, users, `organizations`, and a defined queries source / `QueryLog`).

## Out of scope

Client-specific dashboard behavior and non-admin stat scoping (admin-focused layout for phase 1).
