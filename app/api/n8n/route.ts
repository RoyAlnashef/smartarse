import { NextResponse } from "next/server"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"
import {
  getN8nWebhookServerConfig,
  N8N_WEBHOOK_MAX_BODY_BYTES,
  n8nWebhookBodySchema,
} from "@/lib/n8n-webhook-url"

/**
 * POST /api/n8n
 *
 * Server-side proxy for n8n webhook calls. Keeps N8N_WEBHOOK_URL and
 * N8N_WEBHOOK_SECRET out of the browser bundle.
 */
const SYNC_TIMEOUT_MS = 10_000

export async function POST(request: Request) {
  const session = await requireChatSession(request)
  if (session instanceof NextResponse) {
    return session
  }

  const { profile } = session

  const config = getN8nWebhookServerConfig()
  if (!config) {
    console.error("[/api/n8n] Missing N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET env vars")
    return NextResponse.json<ApiError>(
      { error: "Webhook not configured." },
      { status: 500 }
    )
  }

  const rawBody = await request.text()
  if (rawBody.length > N8N_WEBHOOK_MAX_BODY_BYTES) {
    return NextResponse.json<ApiError>(
      { error: "Request body too large." },
      { status: 413 }
    )
  }

  let json: unknown
  try {
    json = rawBody ? JSON.parse(rawBody) : null
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid JSON body." },
      { status: 400 }
    )
  }

  const parsed = n8nWebhookBodySchema.safeParse(json)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json<ApiError>(
      { error: first?.message ?? "Invalid request body." },
      { status: 400 }
    )
  }

  if (
    parsed.data.user_id !== profile.id ||
    parsed.data.org_id !== profile.organization_id
  ) {
    return NextResponse.json<ApiError>({ error: "Forbidden." }, { status: 403 })
  }

  const body = parsed.data
  const requestId = body.request_id

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
            `[/api/n8n] background upstream completed (status=${res.status}, request_id=${requestId})`
          )
        })
        .catch((err) => {
          console.error(
            `[/api/n8n] background upstream failed (request_id=${requestId}):`,
            err
          )
        })

      return NextResponse.json(
        {
          status: "processing",
          request_id: requestId,
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
