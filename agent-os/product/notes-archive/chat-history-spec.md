# Feature Spec: Chat History (Past Questions)

**Project:** Disrupt AI Research Platform  
**Feature:** Chat History sidebar — fetch, display, paginate, and re-run past questions  
**Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS 4, Shadcn UI, Supabase SSR

---

## Overview

The Chat History sidebar shows the user's 20 most recent unique questions, grouped by date. Clicking any question re-submits it through the n8n webhook (same flow as a new query) and displays the result in the main chat window.

---

## File Structure

```
components/
  chat/
    ChatHistorySidebar.tsx     ← sidebar shell + pagination
    HistoryGroup.tsx           ← date group label + list of items
    HistoryItem.tsx            ← single question row (click to re-run)
    HistoryItemSkeleton.tsx    ← loading skeleton (5 items)

hooks/
  useChatHistory.ts            ← fetch, paginate, refresh
  useRerunQuestion.ts          ← re-submit to webhook + poll + claim

lib/
  chat-history.ts              ← getPastQuestions() fetch function
  sanitise.ts                  ← curly quote sanitisation util
  group-by-date.ts             ← date grouping util
```

---

## Data Contracts

### History Item

```typescript
interface HistoryItem {
  id: number;
  user_query: string; // Display text + re-run payload
  created_at: string; // ISO 8601 — used for date grouping
  status: string; // Always "complete" (errors excluded server-side)
}

interface HistoryResponse {
  history: HistoryItem[];
  pagination: {
    page: number;
    pageSize: number; // Always 5
    totalItems: number; // Max 20
    totalPages: number;
  };
}
```

### Webhook Request (Re-run)

```typescript
interface RerunPayload {
  chatInput: string; // Sanitised user_query from history item
  org_id: string; // From users.organization_id — MUST be org_id, NOT organization_id
  request_id: string; // Fresh crypto.randomUUID() per submission
  sessionId: string; // Current session ID (stable per conversation)
  weighted: boolean; // From org settings
  data_source_mode: string; // "both" | "survey_only" | "reports_only"
  qual_enabled: boolean; // From org settings
}
```

### Webhook Response

```typescript
interface ChatWebhookResponse {
  answer: string; // Markdown with inline [1][2][3][4] citation markers
  sources: Source[];
  visualizations: Viz[];
  route: string;
  tool_calls_used: number;
  low_base_warning: boolean;
  weighted: boolean;
  data_source_mode: string;
}
```

---

## API Endpoints

| Endpoint                           | Method | Auth                          | Purpose                     |
| ---------------------------------- | ------ | ----------------------------- | --------------------------- |
| `/api/chat/history?page=N`         | GET    | Supabase session cookie       | Fetch paginated history     |
| `process.env.NEXT_PUBLIC_N8N_URL`  | POST   | None (org_id scopes response) | Submit/re-run question      |
| `/api/chat/poll?request_id=<uuid>` | GET    | Supabase session cookie       | Poll when webhook times out |
| `/api/chat/claim`                  | POST   | Supabase session cookie       | Associate result with user  |

---

## Implementation

### 1. `lib/chat-history.ts` — Fetch Function

```typescript
export async function getPastQuestions(page = 1): Promise<HistoryResponse> {
  const res = await fetch(`/api/chat/history?page=${page}`);

  if (res.status === 401) throw new Error("Not authenticated");
  if (res.status === 400) throw new Error("No organization assigned");
  if (!res.ok) throw new Error("Failed to fetch history");

  return res.json();
}
```

### 2. `lib/sanitise.ts` — Quote Sanitisation

Always run before sending `chatInput` to the webhook.

```typescript
export function sanitiseQuery(input: string): string {
  return input
    .replace(/[\u201C\u201D\u201F\u2033\u2036]/g, '"') // curly double → straight
    .replace(/[\u2018\u2019\u201B\u2032\u2035]/g, "'") // curly single → straight
    .replace(/[\u2013\u2014]/g, "-") // em/en dash → hyphen
    .trim();
}
```

### 3. `lib/group-by-date.ts` — Date Grouping

```typescript
export function groupByDate(
  items: HistoryItem[],
): Record<string, HistoryItem[]> {
  const groups: Record<string, HistoryItem[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();

  for (const item of items) {
    const dateStr = new Date(item.created_at).toDateString();
    const label =
      dateStr === today
        ? "Today"
        : dateStr === yesterday
          ? "Yesterday"
          : new Date(item.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }

  return groups;
}
```

### 4. `hooks/useChatHistory.ts`

```typescript
import { useState, useCallback } from "react";
import { getPastQuestions } from "@/lib/chat-history";

export function useChatHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [pagination, setPagination] = useState<
    HistoryResponse["pagination"] | null
  >(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPastQuestions(targetPage);
      setHistory(data.history);
      setPagination(data.pagination);
      setPage(targetPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => fetch(1), [fetch]);

  return { history, pagination, page, loading, error, fetch, refresh };
}
```

### 5. `hooks/useRerunQuestion.ts`

```typescript
import { sanitiseQuery } from "@/lib/sanitise";

const N8N_URL = process.env.NEXT_PUBLIC_N8N_URL!;
const TIMEOUT_MS = 85_000;

async function pollForResult(requestId: string): Promise<ChatWebhookResponse> {
  for (let i = 0; i < 80; i++) {
    const wait = i < 10 ? 3_000 : i < 30 ? 5_000 : 8_000;
    await new Promise((r) => setTimeout(r, wait));

    const res = await fetch(`/api/chat/poll?request_id=${requestId}`);

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "5");
      await new Promise((r) => setTimeout(r, retryAfter * 1_000));
      continue;
    }

    if (res.status === 200) {
      const data = await res.json();
      if (data.status === "complete" || data.status === "error_fallback") {
        return data.result;
      }
    }
    // 202 = still processing, continue
  }
  throw new Error("Polling timed out after ~7 minutes");
}

export function useRerunQuestion(
  orgId: string,
  sessionId: string,
  orgSettings: {
    weighted: boolean;
    data_source_mode: string;
    qual_enabled: boolean;
  },
  onResult: (result: ChatWebhookResponse, question: string) => void,
  onRefreshHistory: () => void,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rerun = useCallback(
    async (rawQuestion: string) => {
      const question = sanitiseQuery(rawQuestion);
      const requestId = crypto.randomUUID();
      setLoading(true);
      setError(null);

      const payload: RerunPayload = {
        chatInput: question,
        org_id: orgId, // MUST be org_id — NOT organization_id
        request_id: requestId,
        sessionId,
        weighted: orgSettings.weighted,
        data_source_mode: orgSettings.data_source_mode,
        qual_enabled: orgSettings.qual_enabled,
      };

      try {
        let result: ChatWebhookResponse;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
          const res = await fetch(N8N_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          result = await res.json();
        } catch (err) {
          clearTimeout(timeoutId);
          if ((err as Error).name === "AbortError") {
            result = await pollForResult(requestId);
          } else {
            throw err;
          }
        }

        // Fire-and-forget claim
        fetch("/api/chat/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ request_id: requestId }),
        }).catch(() => {});

        onResult(result, question);
        onRefreshHistory();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
      } finally {
        setLoading(false);
      }
    },
    [orgId, sessionId, orgSettings, onResult, onRefreshHistory],
  );

  return { rerun, loading, error };
}
```

---

## Components

### `ChatHistorySidebar.tsx`

**Responsibilities:**

- Mount → call `useChatHistory` to fetch page 1
- Pass `rerun` callback from `useRerunQuestion` down to `HistoryItem`
- Render grouped history with `HistoryGroup`
- Render loading skeleton (5 items) while fetching
- Render empty state if `history.length === 0`
- Render pagination controls if `totalPages > 1`
- Expose `refresh()` to parent so it can be called after a new query completes

**Props:**

```typescript
interface ChatHistorySidebarProps {
  orgId: string;
  sessionId: string;
  orgSettings: {
    weighted: boolean;
    data_source_mode: string;
    qual_enabled: boolean;
  };
  onQuestionResult: (result: ChatWebhookResponse, question: string) => void;
}
```

**Empty state copy:** `"No questions yet. Ask something to get started."`

**Error state:** Show inline error with a retry button that calls `refresh()`.

---

### `HistoryGroup.tsx`

**Responsibilities:**

- Render date group label (e.g. "Today", "Yesterday", "14 Mar 2026")
- Render list of `HistoryItem` components

**Props:**

```typescript
interface HistoryGroupProps {
  label: string;
  items: HistoryItem[];
  onRerun: (question: string) => void;
  isRerunning: boolean; // Disables all items while a re-run is in flight
}
```

---

### `HistoryItem.tsx`

**Responsibilities:**

- Render `user_query` text, truncated to 2 lines (CSS `line-clamp-2`)
- On click: call `onRerun(item.user_query)`
- Visually disabled + show spinner on the active item while `isRerunning` is true
- Hover state per design system (zinc palette, subtle background shift)

**Props:**

```typescript
interface HistoryItemProps {
  item: HistoryItem;
  onRerun: (question: string) => void;
  isRerunning: boolean;
}
```

---

### `HistoryItemSkeleton.tsx`

- Render 5 placeholder rows matching `HistoryItem` dimensions
- Use Tailwind `animate-pulse` with zinc background
- Two lines per item to match `line-clamp-2` layout

---

## Pagination

- Fixed page size of 5 (server-enforced)
- Max 4 pages (20 items total)
- Render `Previous` / `Next` buttons only when `totalPages > 1`
- Disable `Previous` on page 1, disable `Next` on last page
- Scroll sidebar to top on page change

---

## Session ID

Generate **once** when the chat view mounts. Reuse for all queries (new and re-run) within that session. Do not regenerate on pagination or sidebar refresh.

```typescript
// In the parent chat view — passed down as prop
const sessionId = useRef(crypto.randomUUID()).current;
```

---

## Refresh Triggers

Call `refresh()` (re-fetch page 1) after:

1. A new question is successfully answered
2. A past question re-run completes

Do **not** refresh on page navigation within the sidebar.

---

## Error Handling

| Scenario                        | Behaviour                                |
| ------------------------------- | ---------------------------------------- |
| `401` from history endpoint     | Redirect to login                        |
| `400` from history endpoint     | Show "Account not configured" message    |
| `500` from history endpoint     | Show error + retry button                |
| Webhook AbortError (timeout)    | Fall back to polling automatically       |
| Polling exhausted (80 attempts) | Show inline error on the re-running item |
| Claim endpoint failure          | Swallow silently (fire-and-forget)       |

---

## Critical Notes for Cursor

1. **`org_id` field name is exact** — the webhook payload key must be `org_id`, not `organization_id`. Using the wrong name causes silent save failures (the query runs but never appears in history).

2. **`sessionId` is conversation-scoped** — generate once on mount with `useRef`, not on every render or re-run.

3. **Always sanitise `user_query`** before sending to the webhook — run through `sanitiseQuery()` to strip curly quotes and em-dashes.

4. **Claim is fire-and-forget** — do not await it, do not surface its errors to the user.

5. **Polling max attempts is 80** (not 60) — backoff: 3s × 10, 5s × 20, 8s × 50 = ~7 minutes total.

6. **History auto-deduplicated server-side** — do not attempt client-side deduplication.

7. **Disable all history items while a re-run is in flight** — prevent concurrent submissions.
