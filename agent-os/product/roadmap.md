# smartA.R.S.E. — Product Roadmap

**Phasing:** Canva+Figma-aligned prototype on staging first, then feature build with Supabase + AI integration, then production hardening.

## MVP

### Design & prototype gate

- **Canva + Figma → code**: Implement approved designs (e.g. v0.dev + IDE); design tokens, Shadcn/Tailwind system; **staging deploy**; **client sign-off** before full feature integration.

### Auth & access

- **Auth + user management UI**: Login/logout, password management, session persistence.
- **Role-based access control**: RBAC aligned to product roles; **protected routes** across the app.

### Projects

- **Projects dashboard** (Admin + Client): Search/filter, empty states, loading states.
- **Admin project CRUD**: Create/edit projects; assign clients/users; allocate credits.

### Data & uploads

- **Admin upload interface**: Multi-file uploads (**PDF / CSV / XLSX**), metadata editor, upload **progress** and **validation**.
- **Supabase**: Auth, project CRUD, and **file storage** as the MVP backend.

### AI chat

- **AI chat interface**: Streaming (SSE/WebSocket per API); document selector; history sidebar; export/download; source doc links; credit counter—**integration coordinated with Disrupt’s AI team** (API docs / test endpoints ready before deep integration).

### Supporting product surface

- **Supporting pages**: FAQ shell; privacy/data protection template page; analytics shell; settings/profile.

### Delivery & ops (MVP)

- **Staging + production**; env documentation; **CI/CD** (e.g. GitHub → Netlify/Vercel); cross-browser + responsive + **a11y** pass; **post-launch bug-fix window** (scope per engagement).

---

## Post-MVP

- **Enhanced analytics dashboards** (beyond MVP shell).
- **Advanced monitoring/alerting** and **performance budgets**.
- **Additional export formats** and **richer citation/source previews** in chat.
- **Advanced DevOps**: custom CDN, load balancing, multi-region.
