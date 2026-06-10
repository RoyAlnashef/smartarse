# Visuals — Full Application Security Audit

Diagrams for the client security report. Mermaid sources below; export to PNG if needed for PDF handoff.

---

## System Architecture Overview

High-level request flow for smartA.R.S.E. (Next.js App Router + Supabase + n8n).

```mermaid
flowchart TB
  subgraph clients [Clients]
    Browser[Browser]
    VercelCron[Vercel Cron]
    N8n[n8n Workflow]
    EmailLink[Email Approve/Reject Link]
  end

  subgraph nextjs [Next.js App]
    Middleware[middleware.ts\nCookie refresh]
    Pages[Pages\nDashboard / Client / Demo]
    API[API Routes\napp/api/*]
  end

  subgraph supabase [Supabase]
    Auth[Supabase Auth]
    DB[(PostgreSQL + RLS)]
    Storage[(Storage Buckets)]
  end

  subgraph external [External Services]
    N8nWebhook[n8n Webhook]
    Resend[Resend Email]
  end

  Browser --> Middleware
  Middleware --> Pages
  Browser --> API
  Pages --> Auth
  API --> Auth
  API --> DB
  API --> Storage
  Pages --> DB
  API --> N8nWebhook
  N8n --> API
  VercelCron --> API
  EmailLink --> API
  API --> Resend
```

---

## Trust Boundary Map

Shows authentication mechanism per API tier. Used to prioritize audit Tasks 2–3.

```mermaid
flowchart TB
  subgraph public [Public / Token-Based]
    demoReq["POST /api/demo/request\nNo auth · rate limited"]
    demoEmail["GET /api/demo/approve|reject\nHMAC token in query"]
  end

  subgraph secrets [Shared Secret]
    cronRoutes["GET /api/cron/*\nBearer CRON_SECRET"]
    n8nCb["POST /api/chat/n8n-complete\nBearer or x-chat-n8n-secret"]
  end

  subgraph session [User Session]
    chatRoutes["/api/chat/* · /api/n8n\n/api/focus-group/* · /api/audience/*"]
  end

  subgraph admin [Admin Session]
    adminRoutes["/api/admin/*\nrequireDashboardAdmin → service role"]
  end

  demoReq --> SR[(Service Role DB)]
  demoEmail --> SR
  cronRoutes --> SR
  n8nCb --> SR
  chatRoutes --> RLS[(RLS + selective SR writes)]
  adminRoutes --> SR
```

---

## Audit Phase Flow

Maps audit tasks to deliverables (from `plan.md`).

```mermaid
flowchart LR
  T2[Task 2\nAuth and Session] --> Findings[Findings Log]
  T3[Task 3\nAPI Routes] --> Findings
  T4[Task 4\nRLS and Data] --> Findings
  T5[Task 5\nSecrets] --> Findings
  T6[Task 6\nValidation and Deps] --> Findings
  Findings --> T7[Task 7\nClient Report]
  T7 --> T8[Task 8\nRemediation]
  T8 --> T9[Task 9\nVerify and Sign-off]
```

---

## Role and Data Isolation Model

How org-scoped access is intended to work (verify RLS + API guards enforce this).

```mermaid
flowchart TB
  Admin[Admin Role] --> AllProjects[All Projects and Orgs]
  Client[Client Role] --> OrgProjects[Projects where\norganization_id matches]
  User[User Role] --> AssignedProjects[Projects in\nproject_users assignment]

  AllProjects --> DB[(Supabase RLS)]
  OrgProjects --> DB
  AssignedProjects --> DB
```

---

## Notes for Report Inclusion

- **Executive summary:** Use "System Architecture Overview" and "Role and Data Isolation Model".
- **Technical appendix:** Use "Trust Boundary Map" when documenting per-tier findings.
- **Remediation section:** Use "Audit Phase Flow" to show closed-loop process.

PNG exports are optional; Mermaid renders in GitHub and most markdown viewers.
