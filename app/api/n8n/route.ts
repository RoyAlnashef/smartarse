import { NextResponse } from "next/server"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"
import { getN8nWebhookServerConfig } from "@/lib/n8n-webhook-url"

/**
 * POST /api/n8n
 *
 * Server-side proxy for n8n webhook calls. Keeps N8N_WEBHOOK_URL and
 * N8N_WEBHOOK_SECRET out of the browser bundle.
 *
 * Race-with-timeout async pattern:
 * - If n8n responds within SYNC_TIMEOUT_MS → pass through sync (cache hits, OOS, persona early-returns).
 * - If n8n takes longer → return 202 Accepted with request_id. Client polls /api/chat/poll.
 */
const SYNC_TIMEOUT_MS = 10_000

export async function POST(request: Request) {
  const session = await requireChatSession(request)
  if (session instanceof NextResponse) {
    return session
  }

  const config = getN8nWebhookServerConfig()
  if (!config) {
    console.error("[/api/n8n] Missing N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET env vars")
    return NextResponse.json<ApiError>(
      { error: "Webhook not configured." },
      { status: 500 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid JSON body." },
      { status: 400 }
    )
  }

  const requestId =
    typeof body === "object" &&
    body !== null &&
    "request_id" in body &&
    typeof (body as { request_id: unknown }).request_id === "string"
      ? (body as { request_id: string }).request_id
      : undefined

  const fetchPromise = fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": config.secret,
    },
    body: JSON.stringify(body),
  })

  const timeoutPromise = new Promise<"timeout">((resolve) =>
    setTimeout(() => resolve("timeout"), SYNC_TIMEOUT_MS)
  )

  try {
    const winner = await Promise.race([fetchPromise, timeoutPromise])

    if (winner === "timeout") {
      fetchPromise
        .then(async (res) => {
          try {
            await res.text()
          } catch {
            /* ignore */
          }
          console.info(
            `[/api/n8n] background upstream completed (status=${res.status}, request_id=${requestId ?? "<none>"})`
          )
        })
        .catch((err) => {
          console.error(
            `[/api/n8n] background upstream failed (request_id=${requestId ?? "<none>"}):`,
            err
          )
        })

      return NextResponse.json(
        {
          status: "processing",
          request_id: requestId ?? null,
          message: "Query accepted — poll /api/chat/poll for result.",
        },
        { status: 202 }
      )
    }

    const n8nRes = winner
    const data = await n8nRes.json().catch(() => null)
    return NextResponse.json(data ?? {}, { status: n8nRes.status })
  } catch (err) {
    console.error("[/api/n8n] Upstream error:", err)
    return NextResponse.json<ApiError>(
      { error: "Upstream error." },
      { status: 502 }
    )
  }
}
