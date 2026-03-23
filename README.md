# smartA.R.S.E.

**Agentic Research Search Engine** — an AI-powered market research platform by Disrupt Insight. Query your research data using natural language and explore insights through segment-based personas.

## Overview

smartA.R.S.E. is a full-stack web application that lets research teams and their clients interact with market research data through conversational AI. It supports multiple user roles, document-based queries, and a unique **persona system** that lets you "speak" with representative voices of survey segments (e.g., sustainability attitudes, consumer behaviour).

### Key Features

- **Multi-role access**: Admin and Client roles with role-based routing and permissions
- **Admin dashboard**: Project management, user management, file uploads, analytics, settings, FAQ, and privacy
- **Client portal**: Branded client experience with project search, project detail, and AI chat
- **Supabase auth + session**: Sign in/out and session hydration via Supabase Auth
- **Forgot password flow**: Send reset email from sign-in, recover session from email link, and land on settings to update password
- **AI chat with personas**: Apply segment personas (e.g., "The Muddled Middle", "Do Their Bit") to tailor responses to specific audience segments
- **Document-based queries**: Upload PDF, CSV, and Excel files; select which documents to include in each query
- **Credit system**: Per-client credit allocation and usage tracking

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI**: React 19, [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **Forms**: React Hook Form, Zod, `@hookform/resolvers`
- **State**: React Context (auth), local component state
- **Auth**: [Supabase Auth](https://supabase.com/docs/guides/auth)
- **Package manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/smart-arse.git
cd smart-arse

# Install dependencies
pnpm install

# Configure environment variables (see Environment section below)
# then start the development server

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Sign In

Sign in with the email and password for a user that exists in your Supabase project (create users in the Supabase dashboard or your usual provisioning flow). The app loads **role** (and org) from the **`public.users`** row whose `id` matches the auth user UUID. After a successful sign-in, routing depends on that role:

- **Admin** → `/dashboard`
- **Client** → `/client/projects`

### Forgot Password

The sign-in form includes a `Forgot password?` flow:

1. Click `Forgot password?` to switch to reset mode
2. Enter email and send reset link
3. Open the Supabase reset email
4. Follow the link to `/auth/reset-password`
5. You are redirected to settings to change password:
   - admin -> `/settings`
   - client -> `/client/settings`

## Project Structure

```
├── app/
│   ├── (dashboard)/          # Admin dashboard (sidebar, header)
│   │   ├── dashboard/        # Main dashboard
│   │   ├── projects/[id]/    # Admin project detail (chat, uploads, settings)
│   │   ├── users/            # User management
│   │   ├── upload/           # Global upload
│   │   ├── analytics/        # Analytics
│   │   ├── settings/         # Admin settings
│   │   ├── faq/              # Internal FAQ
│   │   └── privacy/          # Internal privacy
│   ├── client/               # Client-facing area (branded shell)
│   │   ├── projects/         # Project list + search
│   │   └── projects/[id]/    # Client project detail (chat + personas)
│   ├── auth/
│   │   └── reset-password/   # Supabase recovery callback + redirect to settings
│   ├── help/                 # Public help pages (FAQ, privacy, contact)
│   ├── layout.tsx            # Root layout, fonts, AuthProvider
│   └── page.tsx              # Login / redirect
├── components/
│   ├── client/               # Client-specific UI (project cards, chat, persona drawer)
│   ├── chat/                 # Admin chat (window, input, sidebar, document selector)
│   ├── layout/               # Dashboard sidebar, header, mobile sidebar
│   ├── settings/             # Settings sections
│   ├── upload/               # File dropzone, file list
│   └── ui/                   # Radix-based UI primitives
├── lib/
│   ├── auth-context.tsx      # Auth state, login/logout, role-aware helpers
│   ├── mock-data.ts          # Users, clients, projects, files, conversations
│   ├── supabase/
│   │   ├── client.ts         # Browser Supabase client
│   │   └── fetch-user-profile.ts  # Load `public.users` row after auth
│   ├── types.ts              # Shared TypeScript types
│   └── utils.ts              # Utilities (cn, etc.)
└── public/                   # Static assets
```

## Persona System

The client project detail includes a **Persona Drawer** that lets users apply segment personas to the chat. Each persona represents a survey-derived segment with:

- Segment code and title (e.g., "The Muddled Middle Majority")
- Survey sample size and percentage
- Average concern level and sustainable actions
- Voice quotes and interview excerpts
- Top barriers
- Suggested questions

When a persona is applied, the AI responds as a representative of that segment. Persona activation and end events appear inline in the chat timeline.

## Scripts

| Command   | Description                    |
|-----------|--------------------------------|
| `pnpm dev`   | Start dev server (Turbopack)   |
| `pnpm build` | Production build               |
| `pnpm start` | Start production server        |
| `pnpm lint`  | Run ESLint                     |

## Environment

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Optional (server-side integrations only):

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
N8N_WEBHOOK_URL=your_n8n_webhook_url
```

Important notes:

- `NEXT_PUBLIC_*` variables are required for browser auth flows (sign in, forgot password, password update).
- **Row-level security on `public.users`:** enable a policy so each signed-in user can **read their own profile row** (for example `USING (auth.uid() = id)` on `SELECT`). If `SELECT` is denied, the app falls back to JWT metadata or mock email matching, and **routing may not match the row you see in the Table Editor**.
- In Supabase Auth settings, allow these redirect URLs:
  - `http://localhost:3000/auth/reset-password`
  - `https://<your-production-domain>/auth/reset-password`

## License

Proprietary — Disrupt Insight.
