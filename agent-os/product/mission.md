# smartA.R.S.E. — Product Mission

## Problem

Research and insights teams need a single place to **organize client projects**, **upload research documents**, and **ask questions against that corpus**—without losing track of who sees what, how much usage costs (credits), or which files ground each answer. Spreadsheets, shared drives, and ad-hoc chat tools make it hard to keep work scoped per client and auditable.

## Target Users

- **Admins**: Operate the platform—all projects, global uploads, users, analytics.
- **Clients / end users**: See only their organization’s projects; chat with documents selected for context; manage personal settings.

## Solution

**smartA.R.S.E.** is a **project-centric workspace** where each client engagement is a project with its own documents, conversations, and **credit budget**. Users chat in context of **explicitly selected documents** (RAG-style UX). Role-based navigation keeps admin workflows (uploads, user management, analytics) separate from the client experience.

**Implementation status:** This repo may use **mock data** and **simulated AI** while UI and flows are built. **MVP target** (see [`roadmap.md`](./roadmap.md)): **Supabase** (auth, projects, storage) plus **Disrupt’s AI/RAG API** for real chat.
