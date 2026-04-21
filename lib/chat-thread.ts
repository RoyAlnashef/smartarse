import { resultPayloadToClientShape } from "@/lib/api/chat-payload"
import type { ChatMessage } from "@/lib/types"

/** Stored under `chat_results.result_payload` alongside n8n fields. */
export const MESSAGE_THREAD_KEY = "arse_message_thread"

export type ThreadStoredMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

const LAST_MERGED_JOB_KEY = "arse_last_merged_job_request_id"

function asRecord(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}

function parseThreadArray(
  payload: Record<string, unknown>,
  fallbackTimestamp: string
): ThreadStoredMessage[] {
  const raw = payload[MESSAGE_THREAD_KEY]
  if (!Array.isArray(raw)) return []
  const out: ThreadStoredMessage[] = []
  for (const [idx, item] of raw.entries()) {
    const o = asRecord(item)
    const role = o.role
    const content = o.content
    const timestamp = o.timestamp
    const id = o.id
    if (
      (role === "user" || role === "assistant") &&
      typeof content === "string" &&
      content.trim()
    ) {
      out.push({
        id: typeof id === "string" && id.trim() ? id : `thread-${role}-${idx}`,
        role,
        content,
        timestamp:
          typeof timestamp === "string" && timestamp.trim()
            ? timestamp
            : fallbackTimestamp,
      })
    }
  }
  return out
}

/** Build UI messages from a row (uses thread if present, else first Q/A pair). */
export function chatMessagesFromStoredResult(input: {
  user_query: string
  created_at: string
  result_payload: unknown
  conversationId: string
}): ChatMessage[] {
  const payload = asRecord(input.result_payload)
  const thread = parseThreadArray(payload, input.created_at)
  if (thread.length > 0) {
    return thread.map((m) => ({
      id: m.id,
      conversationId: input.conversationId,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }))
  }

  const shape = resultPayloadToClientShape(input.result_payload)
  const assistantText = shape.answer.trim() || "No answer returned."

  return [
    {
      id: `thread-user-${input.conversationId}`,
      conversationId: input.conversationId,
      role: "user",
      content: input.user_query,
      timestamp: input.created_at,
    },
    {
      id: `thread-asst-${input.conversationId}`,
      conversationId: input.conversationId,
      role: "assistant",
      content: assistantText,
      timestamp: input.created_at,
      citations: shape.sources,
    },
  ]
}

/** Serialize current UI messages (user + assistant turns) for Path A webhook / storage. */
export function threadMessagesForPayload(
  messages: Pick<ChatMessage, "id" | "role" | "content" | "timestamp">[]
): ThreadStoredMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }))
}

/**
 * Merge a completed job into the anchor row: append user + assistant turn, refresh fields
 * from the latest `newResult` for tools that read top-level `answer` / `sources`.
 */
export function mergeJobIntoAnchorPayload(input: {
  anchorRequestId: string
  anchorPayload: Record<string, unknown>
  /** First question on the anchor row (`chat_results.user_query`). */
  anchorUserQuery: string
  anchorCreatedAt: string
  jobRequestId: string
  followUpUserQuestion: string
  newResult: Record<string, unknown>
  userTimestamp: string
  assistantTimestamp: string
}): Record<string, unknown> {
  const prev = asRecord(input.anchorPayload)
  if (prev[LAST_MERGED_JOB_KEY] === input.jobRequestId) {
    return { ...prev }
  }

  const existing = parseThreadArray(prev, input.anchorCreatedAt)
  const shape = resultPayloadToClientShape(input.newResult)
  const assistantText = shape.answer.trim() || "No answer returned."

  const newPair: ThreadStoredMessage[] = [
    {
      id: `u-${input.jobRequestId}`,
      role: "user",
      content: input.followUpUserQuestion,
      timestamp: input.userTimestamp,
    },
    {
      id: `a-${input.jobRequestId}`,
      role: "assistant",
      content: assistantText,
      timestamp: input.assistantTimestamp,
    },
  ]

  let message_thread: ThreadStoredMessage[]
  if (existing.length > 0) {
    message_thread = [...existing, ...newPair]
  } else {
    const firstAnswer =
      resultPayloadToClientShape(prev).answer.trim() || "No answer returned."
    message_thread = [
      {
        id: `u-${input.anchorRequestId}`,
        role: "user",
        content: input.anchorUserQuery,
        timestamp: input.anchorCreatedAt,
      },
      {
        id: `a-${input.anchorRequestId}`,
        role: "assistant",
        content: firstAnswer,
        timestamp: input.anchorCreatedAt,
      },
      ...newPair,
    ]
  }

  return {
    ...prev,
    ...input.newResult,
    [MESSAGE_THREAD_KEY]: message_thread,
    [LAST_MERGED_JOB_KEY]: input.jobRequestId,
  }
}
