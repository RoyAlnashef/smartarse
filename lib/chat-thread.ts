import {
  normalizeInlineCitations,
  parseCitationSource,
  resultPayloadToClientShape,
} from "@/lib/api/chat-payload"
import type {
  ChatCitationSource,
  ChatInlineCitation,
  ChatMessage,
  ChatTimelineItem,
  CustomAudienceActivatedEvent,
  PersonaActivatedEvent,
} from "@/lib/types"
import { isCustomAudienceActivatedEvent, isPersonaActivatedEvent } from "@/lib/types"

/** Stored under `chat_results.result_payload` alongside n8n fields. */
export const MESSAGE_THREAD_KEY = "arse_message_thread"

/**
 * One row of the stored thread. `citations` / `inlineCitations` are JSON-
 * serializable snapshots taken at the time the assistant turn was written,
 * so reopening history can render distinct tooltips per `[n]` occurrence
 * without re-running the LLM (see Phase 1 spec).
 *
 * Legacy rows without these fields keep working via documented fallbacks
 * in `chatMessagesFromStoredResult`.
 */
export type ThreadStoredMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  citations?: ChatCitationSource[] | null
  inlineCitations?: ChatInlineCitation[] | null
}

/** Persisted JSON for segment persona activation (uses `kind` in storage). */
export type ThreadStoredPersonaActivationJson = {
  kind: "persona_activated"
  id: string
  timestamp: string
  personaId: string
}

/** Persisted JSON for custom audience activation. */
export type ThreadStoredCustomAudienceActivationJson = {
  kind: "custom_audience_activated"
  id: string
  timestamp: string
  customAudienceName: string
  childSegmentNames: string[]
  baseSize: number | null
  avgConcern: number | null
}

export type ThreadStoredEntry =
  | ThreadStoredMessage
  | ThreadStoredPersonaActivationJson
  | ThreadStoredCustomAudienceActivationJson

const LAST_MERGED_JOB_KEY = "arse_last_merged_job_request_id"

function asRecord(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}

function parseStoredCitations(value: unknown): ChatCitationSource[] | null {
  if (!Array.isArray(value)) return null
  const out: ChatCitationSource[] = []
  for (const [idx, row] of value.entries()) {
    const source = parseCitationSource(row, idx + 1)
    if (source) out.push(source)
  }
  return out.length > 0 ? out : null
}

function isThreadStoredMessage(entry: ThreadStoredEntry): entry is ThreadStoredMessage {
  return "role" in entry && (entry.role === "user" || entry.role === "assistant")
}

export function threadContainsContextActivation(entries: ThreadStoredEntry[]): boolean {
  return entries.some(
    (e) =>
      "kind" in e &&
      (e.kind === "persona_activated" || e.kind === "custom_audience_activated")
  )
}

export function threadHasActivationPrefix(entries: ThreadStoredEntry[]): boolean {
  const first = entries[0]
  return (
    !!first &&
    "kind" in first &&
    (first.kind === "persona_activated" || first.kind === "custom_audience_activated")
  )
}

/** ISO timestamp strictly before `iso` (for sort order: activation before first user turn). */
export function isoOneMsBefore(iso: string): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return iso
  return new Date(t - 1).toISOString()
}

export function parseThreadEntries(
  payload: Record<string, unknown>,
  fallbackTimestamp: string
): ThreadStoredEntry[] {
  const raw = payload[MESSAGE_THREAD_KEY]
  if (!Array.isArray(raw)) return []
  const out: ThreadStoredEntry[] = []
  for (const [idx, item] of raw.entries()) {
    const o = asRecord(item)
    const kind = o.kind
    if (kind === "persona_activated") {
      const personaId = o.personaId
      const id = o.id
      const timestamp = o.timestamp
      if (typeof personaId === "string" && personaId.trim()) {
        out.push({
          kind: "persona_activated",
          id: typeof id === "string" && id.trim() ? id : `persona-act-${idx}`,
          timestamp:
            typeof timestamp === "string" && timestamp.trim()
              ? timestamp
              : fallbackTimestamp,
          personaId: personaId.trim(),
        })
      }
      continue
    }
    if (kind === "custom_audience_activated") {
      const name = o.customAudienceName
      const id = o.id
      const timestamp = o.timestamp
      if (typeof name === "string" && name.trim()) {
        const rawNames = o.childSegmentNames
        const childSegmentNames = Array.isArray(rawNames)
          ? rawNames.filter((n): n is string => typeof n === "string" && n.trim().length > 0)
          : []
        const baseSize = typeof o.baseSize === "number" && Number.isFinite(o.baseSize) ? o.baseSize : null
        const avgConcern =
          typeof o.avgConcern === "number" && Number.isFinite(o.avgConcern) ? o.avgConcern : null
        out.push({
          kind: "custom_audience_activated",
          id: typeof id === "string" && id.trim() ? id : `custom-aud-act-${idx}`,
          timestamp:
            typeof timestamp === "string" && timestamp.trim()
              ? timestamp
              : fallbackTimestamp,
          customAudienceName: name.trim(),
          childSegmentNames,
          baseSize,
          avgConcern,
        })
      }
      continue
    }

    const role = o.role
    const content = o.content
    const timestamp = o.timestamp
    const id = o.id
    if (
      (role === "user" || role === "assistant") &&
      typeof content === "string" &&
      content.trim()
    ) {
      const storedCitations = parseStoredCitations(o.citations)
      const storedInline = Array.isArray(o.inlineCitations ?? o.inline_citations)
        ? normalizeInlineCitations(o.inlineCitations ?? o.inline_citations)
        : null
      out.push({
        id: typeof id === "string" && id.trim() ? id : `thread-${role}-${idx}`,
        role,
        content,
        timestamp:
          typeof timestamp === "string" && timestamp.trim()
            ? timestamp
            : fallbackTimestamp,
        ...(storedCitations ? { citations: storedCitations } : {}),
        ...(storedInline ? { inlineCitations: storedInline } : {}),
      })
    }
  }
  return out
}

/** User/assistant rows only (legacy helper). */
export function threadEntriesOnlyMessages(entries: ThreadStoredEntry[]): ThreadStoredMessage[] {
  return entries.filter(isThreadStoredMessage)
}

export type ChatContextModeForThread = "default" | "persona_segment" | "custom_audience"

export type ContextActivationDenorm = {
  chatContextMode: ChatContextModeForThread
  personaSegmentId: string | null
  customAudienceId: string | null
  customAudienceName: string | null
  customAudienceChildSegmentNames: string[] | null
  /** Stable id for persisted activation row (e.g. anchor or job `request_id`). */
  requestIdForActivationId: string
  baseSize?: number | null
  avgConcern?: number | null
}

export function buildContextActivationStoredJson(
  denorm: ContextActivationDenorm,
  activationTimestamp: string
): ThreadStoredPersonaActivationJson | ThreadStoredCustomAudienceActivationJson | null {
  const ts = activationTimestamp
  if (denorm.chatContextMode === "persona_segment" && denorm.personaSegmentId?.trim()) {
    return {
      kind: "persona_activated",
      id: `persona-act-${denorm.requestIdForActivationId}`,
      timestamp: ts,
      personaId: denorm.personaSegmentId.trim(),
    }
  }
  if (denorm.chatContextMode === "custom_audience") {
    const name = denorm.customAudienceName?.trim()
    if (!name) return null
    const childSegmentNames = (denorm.customAudienceChildSegmentNames ?? []).filter(
      (n) => typeof n === "string" && n.trim().length > 0
    ) as string[]
    return {
      kind: "custom_audience_activated",
      id: `custom-audience-act-${denorm.requestIdForActivationId}`,
      timestamp: ts,
      customAudienceName: name,
      childSegmentNames,
      baseSize: denorm.baseSize ?? null,
      avgConcern: denorm.avgConcern ?? null,
    }
  }
  return null
}

function firstUserTimestampFromEntries(
  entries: ThreadStoredEntry[],
  fallback: string
): string {
  const firstUser = entries.find((e) => isThreadStoredMessage(e) && e.role === "user")
  return firstUser ? firstUser.timestamp : fallback
}

/**
 * Ensures persona/custom-audience activation is stored once as a prefix of
 * `arse_message_thread` when context mode requires it. Idempotent.
 */
export function ensureActivationPrefixInResultRecord(
  result: Record<string, unknown>,
  input: {
    user_query: string
    firstUserTimestamp: string
    denorm: ContextActivationDenorm
  }
): Record<string, unknown> {
  const { denorm } = input
  if (denorm.chatContextMode === "default") return result

  const entries = parseThreadEntries(result, input.firstUserTimestamp)
  if (threadContainsContextActivation(entries)) return result

  const activation = buildContextActivationStoredJson(
    denorm,
    isoOneMsBefore(firstUserTimestampFromEntries(entries, input.firstUserTimestamp))
  )
  if (!activation) return result

  const shape = resultPayloadToClientShape(result)
  const assistantText = shape.answer.trim() || "No answer returned."

  if (entries.length === 0) {
    const message_thread: ThreadStoredEntry[] = [
      activation,
      {
        id: `thread-user-${input.denorm.requestIdForActivationId}`,
        role: "user",
        content: input.user_query,
        timestamp: input.firstUserTimestamp,
      },
      {
        id: `thread-asst-${input.denorm.requestIdForActivationId}`,
        role: "assistant",
        content: assistantText,
        timestamp: input.firstUserTimestamp,
        ...(shape.sources.length > 0 ? { citations: shape.sources } : {}),
        ...(shape.inlineCitations.length > 0
          ? { inlineCitations: shape.inlineCitations }
          : {}),
      },
    ]
    return {
      ...result,
      [MESSAGE_THREAD_KEY]: message_thread,
    }
  }

  return {
    ...result,
    [MESSAGE_THREAD_KEY]: [activation, ...entries],
  }
}

function storedEntryToTimelineItem(
  entry: ThreadStoredEntry,
  conversationId: string
): ChatTimelineItem | null {
  if (isThreadStoredMessage(entry)) {
    return {
      id: entry.id,
      conversationId,
      role: entry.role,
      content: entry.content,
      timestamp: entry.timestamp,
      ...(entry.citations && entry.citations.length > 0 ? { citations: entry.citations } : {}),
      ...(entry.inlineCitations && entry.inlineCitations.length > 0
        ? { inlineCitations: entry.inlineCitations }
        : {}),
    }
  }
  if (entry.kind === "persona_activated") {
    const ev: PersonaActivatedEvent = {
      id: entry.id,
      type: "persona_activated",
      timestamp: entry.timestamp,
      personaId: entry.personaId,
    }
    return ev
  }
  if (entry.kind === "custom_audience_activated") {
    const ev: CustomAudienceActivatedEvent = {
      id: entry.id,
      type: "custom_audience_activated",
      timestamp: entry.timestamp,
      customAudienceName: entry.customAudienceName,
      childSegmentNames: entry.childSegmentNames,
      baseSize: entry.baseSize,
      avgConcern: entry.avgConcern,
    }
    return ev
  }
  return null
}

function applyTopLevelCitationsToMessages(
  messages: ChatMessage[],
  resultPayload: unknown
): ChatMessage[] {
  const hasAssistantCitations = messages.some(
    (m) =>
      m.role === "assistant" &&
      Array.isArray(m.citations) &&
      m.citations.length > 0
  )
  if (hasAssistantCitations) return messages

  const shape = resultPayloadToClientShape(resultPayload)
  if (shape.sources.length < 1) return messages
  const next = [...messages]
  for (let i = next.length - 1; i >= 0; i--) {
    if (next[i].role === "assistant") {
      next[i] = {
        ...next[i],
        citations: shape.sources,
        ...(shape.inlineCitations.length > 0
          ? { inlineCitations: shape.inlineCitations }
          : {}),
      }
      break
    }
  }
  return next
}

export type ChatHydrationFromStored = {
  /** User + assistant only, in thread order, for webhooks / filters. */
  messages: ChatMessage[]
  /**
   * When the stored thread array exists, full ordered timeline (messages + activations).
   * Otherwise null — UI should use `messages` + separate `timelineEvents` + sort.
   */
  orderedTimelineItems: ChatTimelineItem[] | null
  hasStoredContextActivation: boolean
}

/**
 * Hydrate chat UI from `result_payload`: ordered items when `arse_message_thread` exists,
 * otherwise legacy two-message synthesis (no ordered list).
 */
export function chatHydrationFromStoredResult(input: {
  user_query: string
  created_at: string
  result_payload: unknown
  conversationId: string
}): ChatHydrationFromStored {
  const payload = asRecord(input.result_payload)
  const entries = parseThreadEntries(payload, input.created_at)

  if (entries.length === 0) {
    return {
      messages: chatMessagesFromStoredResult(input),
      orderedTimelineItems: null,
      hasStoredContextActivation: false,
    }
  }

  const hasStoredContextActivation = threadContainsContextActivation(entries)
  const orderedRaw = entries
    .map((e) => storedEntryToTimelineItem(e, input.conversationId))
    .filter((x): x is ChatTimelineItem => x != null)

  const messagesOnly = orderedRaw.filter(
    (x): x is ChatMessage =>
      !isPersonaActivatedEvent(x) &&
      !isCustomAudienceActivatedEvent(x) &&
      "role" in x &&
      (x.role === "user" || x.role === "assistant")
  )

  const messages = applyTopLevelCitationsToMessages(messagesOnly, input.result_payload)

  const idToMessage = new Map(messages.map((m) => [m.id, m]))
  const orderedTimelineItems: ChatTimelineItem[] = orderedRaw.map((item) => {
    if ("role" in item && (item.role === "user" || item.role === "assistant")) {
      return idToMessage.get(item.id) ?? item
    }
    return item
  })

  return {
    messages,
    orderedTimelineItems,
    hasStoredContextActivation,
  }
}

/** Build UI messages from a row (uses thread if present, else first Q/A pair). */
export function chatMessagesFromStoredResult(input: {
  user_query: string
  created_at: string
  result_payload: unknown
  conversationId: string
}): ChatMessage[] {
  const payload = asRecord(input.result_payload)
  const entries = parseThreadEntries(payload, input.created_at)
  const thread = threadEntriesOnlyMessages(entries)
  if (thread.length > 0) {
    const messages: ChatMessage[] = thread.map((m) => ({
      id: m.id,
      conversationId: input.conversationId,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      ...(m.citations && m.citations.length > 0 ? { citations: m.citations } : {}),
      ...(m.inlineCitations && m.inlineCitations.length > 0
        ? { inlineCitations: m.inlineCitations }
        : {}),
    }))
    return applyTopLevelCitationsToMessages(messages, input.result_payload)
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
      ...(shape.inlineCitations.length > 0
        ? { inlineCitations: shape.inlineCitations }
        : {}),
    },
  ]
}

/** Serialize current UI messages (user + assistant turns) for Path A webhook / storage. */
export function threadMessagesForPayload(
  messages: Pick<
    ChatMessage,
    "id" | "role" | "content" | "timestamp" | "citations" | "inlineCitations"
  >[]
): ThreadStoredMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      ...(m.citations && m.citations.length > 0 ? { citations: m.citations } : {}),
      ...(m.inlineCitations && m.inlineCitations.length > 0
        ? { inlineCitations: m.inlineCitations }
        : {}),
    }))
}

export type MergeJobIntoAnchorPayloadInput = {
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
  /** When set, prepend / preserve persona or custom-audience activation rows. */
  contextDenorm?: ContextActivationDenorm | null
}

/**
 * Merge a completed job into the anchor row: append user + assistant turn, refresh fields
 * from the latest `newResult` for tools that read top-level `answer` / `sources`.
 */
export function mergeJobIntoAnchorPayload(
  input: MergeJobIntoAnchorPayloadInput
): Record<string, unknown> {
  const prev = asRecord(input.anchorPayload)
  if (prev[LAST_MERGED_JOB_KEY] === input.jobRequestId) {
    return { ...prev }
  }

  const existingEntries = parseThreadEntries(prev, input.anchorCreatedAt)
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
      ...(shape.sources.length > 0 ? { citations: shape.sources } : {}),
      ...(shape.inlineCitations.length > 0
        ? { inlineCitations: shape.inlineCitations }
        : {}),
    },
  ]

  let withActivationPrefix = existingEntries
  const denorm = input.contextDenorm
  if (
    denorm &&
    denorm.chatContextMode !== "default" &&
    !threadContainsContextActivation(existingEntries)
  ) {
    const firstUserTs = firstUserTimestampFromEntries(existingEntries, input.anchorCreatedAt)
    const act = buildContextActivationStoredJson(denorm, isoOneMsBefore(firstUserTs))
    if (act) {
      withActivationPrefix = [act, ...existingEntries]
    }
  }

  const existingMessages = threadEntriesOnlyMessages(withActivationPrefix)

  let message_thread: ThreadStoredEntry[]
  if (existingMessages.length > 0) {
    message_thread = [...withActivationPrefix, ...newPair]
  } else {
    const firstShape = resultPayloadToClientShape(prev)
    const firstAnswer = firstShape.answer.trim() || "No answer returned."
    const firstPair: ThreadStoredMessage[] = [
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
        ...(firstShape.sources.length > 0 ? { citations: firstShape.sources } : {}),
        ...(firstShape.inlineCitations.length > 0
          ? { inlineCitations: firstShape.inlineCitations }
          : {}),
      },
    ]

    let prefix: ThreadStoredEntry[] = []
    if (denorm && denorm.chatContextMode !== "default") {
      const act = buildContextActivationStoredJson(
        denorm,
        isoOneMsBefore(input.anchorCreatedAt)
      )
      if (act) prefix = [act]
    }
    message_thread = [...prefix, ...firstPair, ...newPair]
  }

  return {
    ...prev,
    ...input.newResult,
    [MESSAGE_THREAD_KEY]: message_thread,
    [LAST_MERGED_JOB_KEY]: input.jobRequestId,
  }
}
