"use client"

import { useCallback, useRef, useState } from "react"
import { uuidOrNullForPersist } from "@/lib/uuid-or-null-for-persist"
import { resultPayloadToClientShape, type ChatResultForClient } from "@/lib/api/chat-payload"
import {
  isProjectLiveForChat,
  PROJECT_NOT_LIVE_CHAT_MESSAGE,
} from "@/lib/project-status"
import { getN8nWebhookUrl } from "@/lib/n8n-webhook-url"
import { sanitiseQuery } from "@/lib/sanitise"
import type { Project } from "@/lib/types"
import { segmentColorTokenForDatabase } from "@/lib/theme/cite-color-tokens"

const TIMEOUT_MS = 85_000
const POLL_MAX_ATTEMPTS = 80

type OrgSettings = {
  weighted: boolean
  data_source_mode: string
  qual_enabled: boolean
}

/** One project document for n8n / Disrupt (prompts, citations, metadata). */
export type ChatProjectDocumentWebhookItem = {
  id: string
  name: string
  display_name: string | null
  /** Tailwind cite token; null = default. n8n may consume later for context / sources[]. */
  cite_color_token?: string | null
  /** Admin icon key; null = infer from file. Align with `project_documents.source_icon_key`. */
  source_icon_key?: string | null
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
  /** Path A: anchor row for multi-turn (optional). */
  thread_anchor_request_id?: string
  /** Path A: prior turns for model context (optional). */
  chatHistory?: { role: string; content: string }[]
  /** Ready project documents for this chat (optional). Prefer `display_name ?? name` in workflows. */
  project_documents?: ChatProjectDocumentWebhookItem[]
  /** Active audience context mode used by this query. */
  chat_context_mode?: "default" | "persona_segment" | "custom_audience"
  custom_audience?: {
    id: string | null
    name: string | null
    child_segment_ids: string[] | null
    child_segment_names: string[] | null
    child_segment_color_tokens: (string | null)[] | null
  }
  /** When true, n8n uses persona prompting (suppresses citation-style tooling vs default chat). */
  persona_mode?: boolean
  persona_brief?: string
  persona_brief_concern?: number
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

async function postPersist(body: {
  request_id: string
  project_id: string
  user_query: string
  result: Record<string, unknown>
  status: "pending" | "complete" | "error_fallback"
  thread_anchor_request_id?: string
  merge_user_timestamp?: string
  merge_assistant_timestamp?: string
  persona_segment_id?: string | null
  persona_segment_name?: string | null
  persona_segment_color_token?: string | null
  custom_audience_id?: string | null
  custom_audience_name?: string | null
  custom_audience_child_segment_ids?: string[] | null
  custom_audience_child_segment_names?: string[] | null
  custom_audience_child_segment_color_tokens?: (string | null)[] | null
  chat_context_mode?: "default" | "persona_segment" | "custom_audience"
  /** When false, row is hidden from client chat history until promoted (draft custom-audience explore). */
  show_in_chat_history?: boolean
}): Promise<void> {
  try {
    await fetch("/api/chat/persist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    /* non-blocking: chat result already shown */
  }
}

export type SubmitQuestionOptions = {
  threadAnchorRequestId?: string | null
  /** Path A: messages to send to n8n (e.g. prior turns + current user text). */
  chatHistoryForWebhook?: { role: string; content: string }[]
  /** Sent as `project_documents` on the webhook body when non-empty. */
  projectDocumentsForWebhook?: ChatProjectDocumentWebhookItem[]
  /** Optional LLM-only input override; does not affect persisted `user_query`. */
  webhookChatInput?: string
  personaSegment?: {
    id: string | null
    name: string | null
    colorToken: string | null
  }
  customAudience?: {
    id: string | null
    name: string | null
    childSegmentIds: string[]
    childSegmentNames: string[]
    childSegmentColorTokens: string[]
  }
  chatContextMode?: "default" | "persona_segment" | "custom_audience"
  /** When false, persist hides this thread from chat history until promoted. Default true. */
  showInChatHistory?: boolean
  /** Segment or custom audience; sets `persona_mode` when combined with persona context mode. */
  personaBrief?: string
  personaBriefConcern?: number
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
  onResult?: (
    result: ChatResultForClient,
    question: string,
    meta?: { threadAnchorRequestId?: string; jobRequestId: string }
  ) => void
  onHistoryRefresh?: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeControllerRef = useRef<AbortController | null>(null)
  const activeRequestIdRef = useRef<string | null>(null)
  const activeQuestionRef = useRef<string>("")
  const userCancelledRef = useRef(false)

  const stopQuestion = useCallback(async () => {
    const requestId = activeRequestIdRef.current
    if (!requestId) return

    userCancelledRef.current = true
    activeControllerRef.current?.abort()
    setLoading(false)

    try {
      await fetch("/api/chat/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          project_id: projectId,
          user_query: activeQuestionRef.current || "Cancelled question",
        }),
      })
    } catch {
      /* best-effort cancel marker; late completes are still guarded server-side */
    }
  }, [projectId])

  const submitQuestion = useCallback(
    async (rawQuestion: string, opts?: SubmitQuestionOptions) => {
      const question = sanitiseQuery(rawQuestion)
      if (!question) {
        return
      }
      const webhookQuestion = sanitiseQuery(opts?.webhookChatInput ?? rawQuestion) || question

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
      const userSentIso = new Date().toISOString()
      userCancelledRef.current = false
      activeRequestIdRef.current = requestId
      activeQuestionRef.current = question
      setLoading(true)
      setError(null)

      const anchor = opts?.threadAnchorRequestId?.trim() || undefined
      const history = opts?.chatHistoryForWebhook
      const projectDocs = opts?.projectDocumentsForWebhook
      const personaSegment = opts?.personaSegment
      const customAudience = opts?.customAudience
      const chatContextMode =
        opts?.chatContextMode ??
        (customAudience?.id
          ? "custom_audience"
          : personaSegment?.id
            ? "persona_segment"
            : "default")

      const personaBriefTrimmed = opts?.personaBrief?.trim()
      const personaConcern = opts?.personaBriefConcern
      const usePersonaMode =
        (chatContextMode === "persona_segment" ||
          chatContextMode === "custom_audience") &&
        !!personaBriefTrimmed &&
        typeof personaConcern === "number" &&
        Number.isFinite(personaConcern)

      const showInChatHistory = opts?.showInChatHistory ?? true

      const payload: ChatQuestionWebhookPayload = {
        chatInput: webhookQuestion,
        org_id: orgId,
        user_id: userId,
        request_id: requestId,
        sessionId,
        project_id: projectId,
        weighted: orgSettings.weighted,
        data_source_mode: orgSettings.data_source_mode,
        qual_enabled: true,
        ...(anchor ? { thread_anchor_request_id: anchor } : {}),
        ...(history &&
        history.length > 0 &&
        !usePersonaMode
          ? { chatHistory: history }
          : {}),
        ...(projectDocs && projectDocs.length > 0
          ? { project_documents: projectDocs }
          : {}),
        chat_context_mode: chatContextMode,
        ...(customAudience
          ? {
              custom_audience: {
                id: uuidOrNullForPersist(customAudience.id),
                name: customAudience.name ?? null,
                child_segment_ids:
                  customAudience.childSegmentIds.length > 0
                    ? customAudience.childSegmentIds
                    : null,
                child_segment_names:
                  customAudience.childSegmentNames.length > 0
                    ? customAudience.childSegmentNames
                    : null,
                child_segment_color_tokens:
                  customAudience.childSegmentColorTokens.length > 0
                    ? customAudience.childSegmentColorTokens.map((t) =>
                        segmentColorTokenForDatabase(t)
                      )
                    : null,
              },
            }
          : {}),
        ...(usePersonaMode
          ? {
              persona_mode: true,
              persona_brief: personaBriefTrimmed,
              persona_brief_concern: personaConcern,
            }
          : {}),
      }

      // Seed a pending row so callback reconciliation still works after refresh.
      void postPersist({
        request_id: requestId,
        project_id: projectId,
        user_query: question,
        result: {},
        status: "pending",
        persona_segment_id: personaSegment?.id ?? null,
        persona_segment_name: personaSegment?.name ?? null,
        persona_segment_color_token: segmentColorTokenForDatabase(
          personaSegment?.colorToken ?? null
        ),
        custom_audience_id: uuidOrNullForPersist(customAudience?.id),
        custom_audience_name: customAudience?.name ?? null,
        custom_audience_child_segment_ids:
          customAudience && customAudience.childSegmentIds.length > 0
            ? customAudience.childSegmentIds
            : null,
        custom_audience_child_segment_names:
          customAudience && customAudience.childSegmentNames.length > 0
            ? customAudience.childSegmentNames
            : null,
        custom_audience_child_segment_color_tokens:
          customAudience && customAudience.childSegmentColorTokens.length > 0
            ? customAudience.childSegmentColorTokens.map((t) =>
                segmentColorTokenForDatabase(t)
              )
            : null,
        chat_context_mode: chatContextMode,
        show_in_chat_history: showInChatHistory,
        ...(anchor
          ? {
              thread_anchor_request_id: anchor,
              merge_user_timestamp: userSentIso,
            }
          : {}),
      })

      let result: ChatResultForClient
      let rawForPersist: Record<string, unknown>
      let persistStatus: "complete" | "error_fallback"

      try {
        const controller = new AbortController()
        activeControllerRef.current = controller
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
            if (
              userCancelledRef.current &&
              activeRequestIdRef.current === requestId
            ) {
              return
            }
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

        const assistantIso = new Date().toISOString()
        await postPersist({
          request_id: requestId,
          project_id: projectId,
          user_query: question,
          result: rawForPersist,
          status: persistStatus,
          persona_segment_id: personaSegment?.id ?? null,
          persona_segment_name: personaSegment?.name ?? null,
          persona_segment_color_token: segmentColorTokenForDatabase(
            personaSegment?.colorToken ?? null
          ),
          custom_audience_id: uuidOrNullForPersist(customAudience?.id),
          custom_audience_name: customAudience?.name ?? null,
          custom_audience_child_segment_ids:
            customAudience && customAudience.childSegmentIds.length > 0
              ? customAudience.childSegmentIds
              : null,
          custom_audience_child_segment_names:
            customAudience && customAudience.childSegmentNames.length > 0
              ? customAudience.childSegmentNames
              : null,
          custom_audience_child_segment_color_tokens:
            customAudience && customAudience.childSegmentColorTokens.length > 0
              ? customAudience.childSegmentColorTokens.map((t) =>
                  segmentColorTokenForDatabase(t)
                )
              : null,
          chat_context_mode: chatContextMode,
          show_in_chat_history: showInChatHistory,
          ...(anchor
            ? {
                thread_anchor_request_id: anchor,
                merge_user_timestamp: userSentIso,
                merge_assistant_timestamp: assistantIso,
              }
            : {}),
        })

        onResult?.(result, question, {
          threadAnchorRequestId: anchor,
          jobRequestId: requestId,
        })
        onHistoryRefresh?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed")
      } finally {
        if (activeRequestIdRef.current === requestId) {
          activeControllerRef.current = null
          activeRequestIdRef.current = null
          activeQuestionRef.current = ""
          userCancelledRef.current = false
        }
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
      onResult,
      onHistoryRefresh,
    ]
  )

  return { submitQuestion, rerun: submitQuestion, stopQuestion, loading, error }
}
