# References for Authentication RBAC Foundation

## Similar Implementations

### Auth Context (current mock/session model)

- **Location:** `/Users/royalnashef/Desktop/smart-arse/lib/auth-context.tsx`
- **Relevance:** Defines the existing auth contract used by app shell and pages.
- **Key patterns to preserve:**
  - Stable `useAuth` interface (`user`, `isAuthenticated`, `isLoading`, `login`, `logout`).
  - Session hydration/loading behavior before route redirects.
  - Role-aware helpers (`getVisibleProjects`, `getClientForUser`) as a central source.
- **Migration notes from reference:**
  - Current session source is `sessionStorage` (`disrupt-user`) and mock-data lookup.
  - Current role defaults include `admin`, `client`, `user`; this spec narrows active app-path roles to `admin` and `client`.

### Login Page (current sign-in UX)

- **Location:** `/Users/royalnashef/Desktop/smart-arse/components/login-page.tsx`
- **Relevance:** Current form UX and post-login role-based routing entry points.
- **Key patterns to preserve:**
  - Form-level error handling and `router.replace` for post-login routing.
  - Role-dependent destination selection (`/dashboard` vs `/client/projects`).
  - Existing branded visual treatment and footer support links.
- **Migration notes from reference:**
  - Current submit path calls mock `login(email)` and ignores password verification.
  - Quick demo role buttons (`admin`, `client`, `user`) exist for mock/demo behavior.
  - Forgot-password link is currently absent and explicitly deferred per this spec.

## Product/Standards Context Used During Shaping

- **Product context:**
  - `/Users/royalnashef/Desktop/smart-arse/agent-os/product/mission.md`
  - `/Users/royalnashef/Desktop/smart-arse/agent-os/product/roadmap.md`
  - `/Users/royalnashef/Desktop/smart-arse/agent-os/product/tech-stack.md`
- **Standards context:**
  - `/Users/royalnashef/Desktop/smart-arse/agent-os/standards/javascript/auth-rbac.md`
  - `/Users/royalnashef/Desktop/smart-arse/agent-os/standards/global/app-routing-protected-shell.md`
  - `/Users/royalnashef/Desktop/smart-arse/agent-os/standards/global/project-conventions.md`
