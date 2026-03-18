# References for Sign-in + client theme

## Code to study or change

### Login & entry

- **`components/login-page.tsx`** — Current sign-in UI; will be replaced by themed version + role-based `router.push` after login.
- **`app/page.tsx`** — Root auth gate and redirect for already-logged-in users; must align redirects with role (admin vs client/user).

### Admin dashboard (unchanged styling)

- **`app/(dashboard)/layout.tsx`** — Protected shell; add guard so client/user roles do not see admin chrome.
- **`app/(dashboard)/dashboard/page.tsx`** — Today’s project grid for all roles; admin-only destination after this spec for admin users.

### Auth & data

- **`lib/auth-context.tsx`** — Mock `login`, `user.role`, `getVisibleProjects()`.
- **`lib/types.ts`** — `UserRole`: `admin` | `client` | `user`.

## Similar patterns

- New **`app/(client)/`** route group should mirror dashboard layout patterns: loading spinner, `router.replace("/")` when unauthenticated, `router.replace("/dashboard")` when admin lands on client-only routes.
