# Auth & RBAC

## Roles

`UserRole`: `"admin"` | `"client"` | `"user"`.

| Role | Meaning |
|------|---------|
| `admin` | Full platform; all projects. |
| `client` | Org lead; projects where `project.clientId === user.clientId`. |
| `user` | End user; projects in `project.assignedUserIds`. |

## API surface (`useAuth`)

- `user`, `isAuthenticated`, `isLoading`
- `login(email)` → `User | null` (mock: match `users` by email, case-insensitive)
- `logout()` — clears session
- `switchRole(role)` — **dev/demo only**: swaps to a fixed mock user per role (`roleDefaults`)
- `getVisibleProjects()` — **single source** for project lists by role
- `getClientForUser()` — client row for `client`/`user` with `clientId`

## Rules

- **`useAuth()`** must run under `AuthProvider` — throws otherwise.
- **Persist minimal payload**: store `{ id }` only; re-hydrate full `User` from canonical source (today mock `users`; later Supabase).
- **Session key** (current): `sessionStorage` key `disrupt-user` — **rename to a smartA.R.S.E. key** when moving off mock (e.g. rely on Supabase session; avoid duplicate client-only keys for security-sensitive flows).

## Page-level RBAC

- **Layout** does not check roles. For admin-only routes (e.g. `/upload`), gate in the page: early return “Access Denied” or redirect.
- **Nav**: filter links by `roles` array (see sidebar pattern) — keep nav and route guards in sync.

## MVP migration

- Replace mock `login` with Supabase Auth; map JWT/app user to same `User` shape in `lib/types.ts`.
- Enforce roles **server-side** (RLS / API), not only client checks.
