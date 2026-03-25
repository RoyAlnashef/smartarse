# Shape: Client projects (Supabase data on client routes)

## Decision

Ship **project list and detail shell** from Supabase first (`listProjectsForAuthUser`, `getProjectById`). Defer **credits** (header CREDITS block), **real sources/file counts**, and **chat/personas/history** until follow-up specs or product confirms semantics.

## Scope (in)

- Card: `created_at` → pink date bar, `name`, `description`, sources subline via existing `sourceLine()` (empty files → “configure in dashboard” until RAG wiring).
- Detail: PROJECT DETAIL card fields `name`, `description` only from live `Project` when session + Supabase are available.
- Loading, error toast, and mock fallback aligned with dashboard `projects-workspace` / `useRemoteProjects` patterns.
- RLS on `projects` is assumed; this spec does **not** add new policies.

## Scope (out, for now)

- Chat UI, persona column, sources checkboxes, chat history (stay mock on `app/client/projects/[id]/page.tsx`).
- CREDITS widget from `organizations.credit_balance` (still `getClientForUser()` mock org unless Task 5).

## Screenshot references

Copies live in this folder’s `visuals/`:

| File | Role |
|------|------|
| `01-client-project-list.png` | Client project list / cards (from sign-in client-theme mock). |
| `02-client-project-detail.png` | Client project detail shell (from client project detail mock). |

Original sources (repo):

- `agent-os/specs/2026-03-17-1200-sign-in-client-theme/visuals/project-list-9d8faa74-b076-455f-afed-467ed6121ad0.png`
- `agent-os/specs/2026-03-17-1545-client-project-detail/visuals/project-detail-d65f8e9f-8542-44c4-92a6-f17dc32071e5.png`

## RBAC

`/client/*` is for **`role === "client"`** only per `app/client/layout.tsx`; `user` role is redirected off these routes.

## Traceability

Parent dashboard projects work: `agent-os/specs/2026-03-24-1600-projects-supabase-dashboard/plan.md` (link Task 9 to this spec when implementation lands).
