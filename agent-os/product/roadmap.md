# smartA.R.S.E. — Product Roadmap

**Phasing:** Canva+Figma-aligned prototype on staging first, then feature build with Supabase + AI integration, then production hardening.

## Current Status Snapshot (Apr 2026)

- **Completed recently:**
  - Supabase-backed organizations dashboard flows (create/edit/deactivate)
  - User-to-organization assignment from dashboard users surface
  - Admin-only user creation flow via `POST /api/admin/users`; removal via `DELETE /api/admin/users/[id]`
  - Supabase SQL migrations for admin RLS, org constraints, project lifecycle, storage RLS, and `chat_results`
  - Forgot password and reset-password redirect into role-appropriate settings
  - **Project chat (n8n path):** webhook from client → `POST /api/chat/persist` → `GET /api/chat/poll` (and related routes); optional `POST /api/chat/n8n-complete` for long-running workflows
  - **Chat history:** `GET /api/chat/history` backed by `chat_results`; client hooks merge API data with in-session items (pagination/re-run polish still open)
  - **Credits & status:** live projects auto-pause when allocated credits are exhausted (database trigger)
  - **Access window:** optional `access_until` (UTC calendar day); auto-pause after end date via row triggers, RPC before chat persist/completion, and `GET /api/cron/pause-expired-projects` (Vercel Cron + `CRON_SECRET`); admin project settings and client UX for the window
  - Admin helpers for project chat QA: `GET /api/admin/projects/[id]/chat-history`, `GET /api/admin/projects/[id]/chat-result`
- **In progress:**
  - Document-grounded RAG depth and production-grade retrieval (upload/selector UX exists; backend integration still evolving)
  - Chat product polish: history pagination, re-run-from-history, edge cases (see `agent-os/product/dev-notes/chat-history-spec.md`)
  - Credit consumption reporting and analytics beyond current surfaces
  - End-to-end verification across local and hosted Supabase environments; deployment and lint/build hardening

## MVP

### Design & prototype gate

- **Canva + Figma → code**: Implement approved designs (e.g. v0.dev + IDE); design tokens, Shadcn/Tailwind system; **staging deploy**; **client sign-off** before full feature integration.

### Auth & access

- **Auth + user management UI**: Login/logout, password management, session persistence. *(Forgot-password flow and Supabase recovery are implemented.)*
- **Role-based access control**: RBAC aligned to product roles; **protected routes** across the app.

### Projects

- **Projects dashboard** (Admin + Client): Search/filter, empty states, loading states.
- **Admin project CRUD**: Create/edit projects; assign clients/users; allocate credits.
- **Access & lifecycle**: Optional **access end date** and automatic pause when the window ends or credits deplete *(implemented in app + DB + scheduled job; see root `README.md` for env and routes).*

### Data & uploads

- **Admin upload interface**: Multi-file uploads (**PDF / CSV / XLSX**), metadata editor, upload **progress** and **validation**.
- **Supabase**: Auth, project CRUD, and **file storage** as the MVP backend.

### AI chat

- **AI chat interface**: Today the product uses **n8n-coordinated** flows with **polling** for completion; streaming (SSE/WebSocket) remains a target where the API supports it. Document selector; history sidebar; export/download; source doc links; credit counter—**integration coordinated with Disrupt’s AI team** (API docs / test endpoints ready before deep integration).

### Supporting product surface

- **Supporting pages**: FAQ shell; privacy/data protection template page; analytics shell; settings/profile. *(Public help routes and internal FAQ/privacy surfaces exist; depth and analytics remain lighter than end-state.)*

### Delivery & ops (MVP)

- **Staging + production**; env documentation; **CI/CD** (e.g. GitHub → Netlify/Vercel); cross-browser + responsive + **a11y** pass; **post-launch bug-fix window** (scope per engagement). *(Vercel Cron configured for daily pause of expired access windows when secrets are set.)*

---

## Post-MVP

- **Enhanced analytics dashboards** (beyond MVP shell).
- **Advanced monitoring/alerting** and **performance budgets**.
- **Additional export formats** and **richer citation/source previews** in chat.
- **Streaming-first chat transport** where the AI stack supports it (alongside or replacing poll-based completion).
- **Advanced DevOps**: custom CDN, load balancing, multi-region.
