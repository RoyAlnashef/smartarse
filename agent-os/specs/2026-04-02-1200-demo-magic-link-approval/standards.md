# Standards for demo magic-link approval

The following standards apply to this work.

---

## javascript/auth-rbac

**Why it applies:** Demo users need a defined role and `organization_id`; the admin analytics UI is admin-only; magic-link completion must resolve to the same `User` model and project visibility rules.

```markdown
# Auth & RBAC

## Roles

`UserRole`: `"admin"` | `"client"` | `"user"`.

| Role | Meaning |
|------|---------|
| `admin` | Full platform; all projects. |
| `client` | Org lead; projects where `project.organization_id === user.organization_id`. |
| `user` | End user; projects in `project.assignedUserIds`. |

## API surface (`useAuth`)

- `user`, `isAuthenticated`, `isLoading`
- `login(email)` → `User | null` (mock: match `users` by email, case-insensitive)
- `logout()` — clears session
- `switchRole(role)` — **dev/demo only**: swaps to a fixed mock user per role (`roleDefaults`)
- `getVisibleProjects()` — **single source** for project lists by role
- `getClientForUser()` — org/client row for `client`/`user` with `organization_id` (maps to `users.organization_id` in Supabase)

## Rules
- `AuthProvider` / `useAuth` are client-side conveniences layered on top of Supabase Auth (no custom auth backend).
- **`useAuth()`** must run under `AuthProvider` — throws otherwise.
- **Persist minimal payload**: store `{ id }` only; re-hydrate full `User` from canonical source (today mock `users`; later Supabase).
- **Session key** (current): `sessionStorage` key `disrupt-user` — **rename to a smartA.R.S.E. key** when moving off mock (e.g. rely on Supabase session; avoid duplicate client-only keys for security-sensitive flows).

## Page-level RBAC

- **Layout** does not check roles. For admin-only routes (e.g. `/upload`), gate in the page: early return “Access Denied” or redirect.
- **Nav**: filter links by `roles` array (see sidebar pattern) — keep nav and route guards in sync.

## MVP migration

- Replace mock `login` with Supabase Auth; map JWT/app user to same `User` shape in `lib/types.ts`.
- Enforce roles **server-side** (RLS / API), not only client checks.
```

_Source:_ [`agent-os/standards/javascript/auth-rbac.md`](../../standards/javascript/auth-rbac.md)

---

## global/developer-guide

**Why it applies:** Demo flow adds server routes, email, and Supabase Admin usage; service role and org-scoped data rules must hold for demo users and chat payloads.

See the canonical file in the repo: [`agent-os/standards/global/developer-guide.md`](../../standards/global/developer-guide.md).

Summary of constraints most relevant to this feature:

- **Connections:** Frontend → Supabase (Auth + DB), n8n webhook (chat), optional Vercel API routes.
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY` is server-only; never in the browser bundle. `SUPABASE_ANON_KEY` is public; RLS scopes data.
- **Auth (current doc):** Describes email/password via anon client; this feature adds **magic link** via Admin APIs—still no custom auth server beyond Next + Supabase.
- **Org:** Every user has `organization_id`; include it in chat webhook payloads; RLS scopes queries.
- **Security:** Admin routes role-gated; do not expose admin APIs in standard user UI.

---

## global/app-routing-protected-shell

**Why it applies:** The demo request page must be **public** (outside the dashboard auth gate); the analytics list lives in the **dashboard** with admin page-level RBAC.

```markdown
# App routing & protected shell

## URLs vs folders

| URL                                          | Folder              |
| -------------------------------------------- | ------------------- |
| `/`                                          | `app/page.tsx`      |
| `/dashboard`, `/upload`, `/projects/[id]`, … | `app/(dashboard)/…` |

`(dashboard)` is a **route group** — it does **not** appear in the path.

## Root layout (`app/layout.tsx`)

- **Server Component** only: fonts, `metadata` / `viewport`, `globals.css`.
- Wrap all pages: `<AuthProvider>{children}</AuthProvider>`.

## Public entry (`app/page.tsx`)

- **`"use client"`** — uses `useAuth` + `useRouter`.
- `isLoading` → full-screen spinner (centered, `border-mint-300` ring).
- Authenticated + loaded → `router.replace("/dashboard")` (also show spinner while redirecting).
- Otherwise → `<LoginPage />`.

## Protected shell (`app/(dashboard)/layout.tsx`)

- **`"use client"`** — same auth hook pattern.
- `isLoading` → same spinner.
- Not authenticated → `router.replace("/")` + spinner until redirect.
- Authenticated → sidebar + header + `<main>{children}</main>`.

**Layout enforces login only**, not roles. Admin/client checks stay on **pages** (or future middleware), but API/data access must still be enforced server-side (Supabase session + RLS).

## Redirects

- Auth churn: **`router.replace`**, not `push` — avoids back-button loops.

## New dashboard routes

- Add under `app/(dashboard)/<segment>/page.tsx` — they automatically get the shell and auth gate.

## MVP note

- Today, the layout/auth gate is **client-only UX**. Real enforcement must be server-side: API/webhook routes require a valid Supabase session cookie or `Authorization` header, and Supabase RLS scopes all data to the user’s org (`organization_id`/`org_id`). Keep this layout UX for hydration/redirect behavior.
```

_Source:_ [`agent-os/standards/global/app-routing-protected-shell.md`](../../standards/global/app-routing-protected-shell.md)
