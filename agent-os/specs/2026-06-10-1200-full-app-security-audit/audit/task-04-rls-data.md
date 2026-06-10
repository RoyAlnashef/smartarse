# Task 4 — Supabase RLS and Data Access Audit

**Status:** Complete | **Date:** 2026-06-10

## Migrations Reviewed

| Migration | Focus |
|-----------|-------|
| `202603232355_admin_rls_users_organizations.sql` | `is_dashboard_admin()`, users/orgs admin policies, self-read |
| `202603242010_organizations_select_own_org.sql` | Members read own org row |
| `202603241900_projects_project_users_rls.sql` | Project assignment RLS |
| `202603251200_fix_projects_rls_recursion.sql` | `auth_user_can_read_project()` SECURITY DEFINER |
| `202603261600_storage_project_docs_rls_helpers.sql` | Storage insert/select helpers |
| `202603311200_chat_results.sql` | Org-scoped read; service-role writes |
| `202605191200_demo_access_requests.sql` | Admin-only SELECT/UPDATE; no INSERT for authenticated |
| `202605111400_project_custom_audiences_select_creator.sql` | Creator-scoped audience access |

## Client-Side Data Layer

Reviewed `lib/supabase/projects.ts`, `users.ts`, `organizations.ts`, `documents.ts`, `personas.ts`, `custom-audiences.ts`.

All use browser Supabase client with anon key — security depends entirely on RLS. Admin mutations from browser are gated by `is_dashboard_admin()` policies. Document/persona uploads use `{projectId}/{id}/{filename}` paths; storage RLS validates first path segment against project UUID.

## SECURITY DEFINER RPCs

| Function | Caller check | Assessment |
|----------|--------------|------------|
| `is_dashboard_admin()` | `auth.uid()` role in users table | OK |
| `auth_user_can_read_project()` | Admin OR org client OR assigned user | OK; **SEC-011** role case |
| `can_insert_project_document_storage_object()` | Admin + valid project path | OK |
| `can_select_project_document_storage_object()` | `auth_user_can_read_project` | OK |
| `expire_pending_demo_access_requests()` | Cron via service role only | OK |
| `pause_project_if_access_expired()` | Called from API with service role | OK |

## Findings

| ID | Severity | Summary |
|----|----------|---------|
| SEC-010 | Medium | `chat_results` with null `project_id` visible to entire org |
| SEC-011 | Low | `auth_user_can_read_project` uses exact role strings |

## Positive Controls

- `users_select_self_or_admin` enables secure profile reads (critical for auth bootstrap).
- `chat_results` has no INSERT/UPDATE policies for authenticated — writes forced through service role API routes.
- Storage policies avoid RLS recursion via SECURITY DEFINER helpers.
- Demo requests cannot be inserted by authenticated users directly (service role only).
- Project delete requires zero credits (separate migration).

## Data Isolation Model

```
Admin → all projects (is_dashboard_admin)
Client → projects where organization_id matches
User → projects in project_users + same org
```

RLS aligns with product RBAC model. Gap: legacy unscoped `chat_results` rows bypass project-level isolation within an org.
