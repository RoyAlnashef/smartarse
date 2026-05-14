import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/n8n
 *
 * Server-side proxy for n8n webhook calls.
 * Keeps N8N_WEBHOOK_URL and N8N_WEBHOOK_SECRET server-only (no NEXT_PUBLIC_).
 * All client components call this route instead of n8n directly.
 *
 * P206 (IA-018): Race-with-timeout async pattern.
 * - If n8n responds within SYNC_TIMEOUT_MS → pass through sync (fast paths: cache
 *   hits, OOS refusals, persona early-returns).
 * - If n8n takes longer → return 202 Accepted with request_id. Client polls
 *   /api/chat/poll for the final answer. Background fetch continues to completion
 *   (Save Result writes to chat_results as normal).
 * - Eliminates Cloudflare 524 failure mode on >100s tail latency and 85s client
 *   AbortController timeout on full AI pipeline queries.
 */

// 10s sync window — covers all fast routes (cache hits ~2-3s, OOS ~1.5-4s,
// persona early-return ~4-8s). Full AI pipeline (25-58s) flips to async.
const SYNC_TIMEOUT_MS = 10_000;

export async function POST(request: NextRequest) {
  // Auth check — must be a logged-in user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!n8nUrl || !secret) {
    console.error("[/api/n8n] Missing N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET env vars");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.json();
  const requestId: string | undefined =
    typeof body?.request_id === "string" ? body.request_id : undefined;

  // Fire the upstream fetch but don't await it yet — we want to race it against
  // a timer so that slow calls can return 202 while fast calls still pass through.
  const fetchPromise = fetch(n8nUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": secret,
    },
    body: JSON.stringify(body),
  });

  const timeoutPromise = new Promise<"timeout">((resolve) =>
    setTimeout(() => resolve("timeout"), SYNC_TIMEOUT_MS),
  );

  try {
    const winner = await Promise.race([fetchPromise, timeoutPromise]);

    if (winner === "timeout") {
      // Keep the upstream request alive in the background so Save Result writes
      // to chat_results; the client will poll /api/chat/poll for the answer.
      // Next.js App Router keeps the function invocation alive until the promise
      // settles or the Fluid Compute timeout (300s) is hit, whichever comes first.
      fetchPromise
        .then(async (res) => {
          // Drain the body so the connection closes cleanly — we don't use the
          // value, but leaving it undrained can cause stream warnings.
          try {
            await res.text();
          } catch {
            /* ignore */
          }
          console.info(
            `[/api/n8n] background upstream completed (status=${res.status}, request_id=${requestId ?? "<none>"})`,
          );
        })
        .catch((err) => {
          console.error(
            `[/api/n8n] background upstream failed (request_id=${requestId ?? "<none>"}):`,
            err,
          );
        });

      return NextResponse.json(
        {
          status: "processing",
          request_id: requestId ?? null,
          message: "Query accepted — poll /api/chat/poll for result.",
        },
        { status: 202 },
      );
    }

    // Fast path — upstream returned within SYNC_TIMEOUT_MS. Pass through as before.
    const n8nRes = winner;
    const data = await n8nRes.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: n8nRes.status });
  } catch (err) {
    console.error("[/api/n8n] Upstream error:", err);
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }
}
