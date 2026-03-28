"use client"

import { useCallback, useState } from "react"
import { resultPayloadToClientShape, type ChatResultForClient } from "@/lib/api/chat-payload"
import {
  isProjectLiveForChat,
  PROJECT_NOT_LIVE_CHAT_MESSAGE,
} from "@/lib/project-status"
import { getN8nWebhookUrl } from "@/lib/n8n-webhook-url"
import { sanitiseQuery } from "@/lib/sanitise"
import type { Project } from "@/lib/types"

const TIMEOUT_MS = 85_000
const POLL_MAX_ATTEMPTS = 80

type OrgSettings = {
  weighted: boolean
  data_source_mode: string
  qual_enabled: boolean
}

export type ChatQuestionWebhookPayload = {
  chatInput: string
  org_id: string
  user_id: string
  request_id: string
  sessionId: string
  project_id: string
  weighted: boolean
  data_source_mode: string
  qual_enabled: boolean
}

function unknownToResultRecord(data: unknown): Record<string, unknown> {
  if (typeof data === "string") {
    return { answer: data }
  }
  if (data !== null && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>
  }
  if (Array.isArray(data) && data[0] !== null && typeof data[0] === "object") {
    return data[0] as Record<string, unknown>
  }
  return {}
}

function persistPayloadStatus(
  record: Record<string, unknown>
): "complete" | "error_fallback" | undefined {
  const s = record.status
  if (s === "complete" || s === "error_fallback") {
    return s
  }
  return undefined
}

async function pollForResult(requestId: string): Promise<{
  result: ChatResultForClient
  raw: Record<string, unknown>
  status: "complete" | "error_fallback"
}> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const wait = i < 10 ? 3_000 : i < 30 ? 5_000 : 8_000
    await new Promise((r) => setTimeout(r, wait))

    const res = await fetch(
      `/api/chat/poll?request_id=${encodeURIComponent(requestId)}`
    )

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "5", 10)
      await new Promise((r) => setTimeout(r, retryAfter * 1_000))
      continue
    }

    if (res.status === 200) {
      const data = (await res.json()) as {
        status?: string
        result?: unknown
      }
      if (
        data.status === "complete" ||
        data.status === "error_fallback"
      ) {
        const raw = unknownToResultRecord(data.result)
        return {
          status: data.status,
          result: resultPayloadToClientShape(data.result),
          raw,
        }
      }
    }
  }
  throw new Error("Polling timed out after ~7 minutes")
}

function firePersist(body: {
  request_id: string
  project_id: string
  user_query: string
  result: Record<string, unknown>
  status: "complete" | "error_fallback"
}) {
  void fetch("/api/chat/persist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {})
}

export function useChatQuestion({
  orgId,
  userId,
  projectId,
  projectStatus,
  sessionId,
  orgSettings,
  onResult,
  onHistoryRefresh,
}: {
  orgId: string
  userId: string
  projectId: string
  /** When not `live`, outbound chat is blocked (server enforces on persist as well). */
  projectStatus: Project["status"]
  sessionId: string
  orgSettings: OrgSettings
  onResult?: (result: ChatResultForClient, question: string) => void
  onHistoryRefresh?: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitQuestion = useCallback(
    async (rawQuestion: string) => {
      const question = sanitiseQuery(rawQuestion)
      if (!question) {
        return
      }

      if (!userId) {
        setError("You must be signed in to send a message.")
        return
      }

      if (!isProjectLiveForChat(projectStatus)) {
        setError(PROJECT_NOT_LIVE_CHAT_MESSAGE)
        return
      }

      const n8nUrl = getN8nWebhookUrl()
      if (!n8nUrl) {
        setError(
          "Chat webhook URL is not configured (set NEXT_PUBLIC_N8N_URL)."
        )
        return
      }

      const requestId = crypto.randomUUID()
      setLoading(true)
      setError(null)

      const payload: ChatQuestionWebhookPayload = {
        chatInput: question,
        org_id: orgId,
        user_id: userId,
        request_id: requestId,
        sessionId,
        project_id: projectId,
        weighted: orgSettings.weighted,
        data_source_mode: orgSettings.data_source_mode,
        qual_enabled: orgSettings.qual_enabled,
      }

      let result: ChatResultForClient
      let rawForPersist: Record<string, unknown>
      let persistStatus: "complete" | "error_fallback"

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

        try {
          const res = await fetch(n8nUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal,
          })
          clearTimeout(timeoutId)

          if (!res.ok) {
            const text = await res.text().catch(() => "")
            throw new Error(text || `Webhook request failed (${res.status})`)
          }

          const data: unknown = await res.json()
          const raw = unknownToResultRecord(data)
          persistStatus = persistPayloadStatus(raw) ?? "complete"
          result = resultPayloadToClientShape(data)
          rawForPersist = raw
        } catch (err) {
          clearTimeout(timeoutId)
          if ((err as Error).name === "AbortError") {
            const polled = await pollForResult(requestId)
            result = polled.result
            rawForPersist =
              Object.keys(polled.raw).length > 0
                ? polled.raw
                : (polled.result as unknown as Record<string, unknown>)
            persistStatus = polled.status
          } else {
            throw err
          }
        }

        firePersist({
          request_id: requestId,
          project_id: projectId,
          user_query: question,
          result: rawForPersist,
          status: persistStatus,
        })

        onResult?.(result, question)
        onHistoryRefresh?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed")
      } finally {
        setLoading(false)
      }
    },
    [
      orgId,
      userId,
      projectId,
      projectStatus,
      sessionId,
      orgSettings.weighted,
      orgSettings.data_source_mode,
      orgSettings.qual_enabled,
      onResult,
      onHistoryRefresh,
    ]
  )

  return { submitQuestion, rerun: submitQuestion, loading, error }
}
