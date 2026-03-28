/** Default page size for admin dashboard tables (users, organizations, etc.). */
export const LIST_PAGE_SIZE = 25

/**
 * Scoped shadcn `--accent` for admin dashboard main column and portaled surfaces.
 * Makes outline/ghost `hover:bg-accent` use brand pink instead of global cyan.
 * White foreground keeps hover labels readable on saturated pink.
 */
export const DASHBOARD_MAIN_ACCENT_CLASS =
  "[--accent:var(--arse-pink)] [--accent-foreground:var(--arse-white)]" as const
