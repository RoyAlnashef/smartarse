# smartA.R.S.E.

**Agentic Research Search Engine** — an AI-powered market research platform by Disrupt Insight. Query your research data using natural language and explore insights through segment-based personas.

## Overview

smartA.R.S.E. is a full-stack web application that lets research teams and their clients interact with market research data through conversational AI. It supports multiple user roles, document-based queries, and a unique **persona system** that lets you "speak" with representative voices of survey segments (e.g., sustainability attitudes, consumer behaviour).

### Key Features

- **Multi-role access**: Admin, Client, and User roles with role-based routing and permissions
- **Admin dashboard**: Project management, user management, file uploads, analytics, settings, FAQ, and privacy
- **Client portal**: Branded client experience with project search, project detail, and AI chat
- **AI chat with personas**: Apply segment personas (e.g., "The Muddled Middle", "Do Their Bit") to tailor responses to specific audience segments
- **Document-based queries**: Upload PDF, CSV, and Excel files; select which documents to include in each query
- **Credit system**: Per-client credit allocation and usage tracking
- **Demo mode**: Quick-login buttons for testing different roles without real auth

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI**: React 19, [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **Forms**: React Hook Form, Zod, `@hookform/resolvers`
- **State**: React Context (auth), local component state
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

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Login

The app uses mock auth for demo purposes. On the login page, use the **Quick demo access** buttons:

| Role   | Email                     | Description              |
|--------|---------------------------|--------------------------|
| Admin  | sarah@disrupt-insight.com | Full system access       |
| Client | marcus@acmeretail.com     | Client project view      |
| User   | david@acmeretail.com      | Assigned projects only   |

Admins land on `/dashboard`; clients and users land on `/client/projects`.

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
│   ├── auth-context.tsx      # Auth state, login, role switching
│   ├── mock-data.ts          # Users, clients, projects, files, conversations
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

The app currently runs with mock data (`lib/mock-data.ts`) and session-based demo auth. No environment variables are required for local development.

## License

Proprietary — Disrupt Insight.
