/** Normalized assistant payload for poll / UI (see chat-history-spec.md + summary_chat_result_rows.md). */
import type { ChatCitationSource } from "@/lib/types"

export type ChatResultForClient = {
  answer: string
  sources: ChatCitationSource[]
  visualizations: unknown[]
  route: string
  tool_calls_used: number
  low_base_warning: boolean
  weighted: boolean
  data_source_mode: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asStringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function parseCitationSource(raw: unknown, fallbackIndex: number): ChatCitationSource | null {
  const row = asRecord(raw)
  const index =
    asNumber(row.index) ??
    asNumber(row.source_index) ??
    asNumber(row.citation_index) ??
    fallbackIndex
  if (!Number.isInteger(index) || index < 1) return null

  const displayName =
    asStringOrNull(row.display_name) ??
    asStringOrNull(row.displayName) ??
    asStringOrNull(row.document_display_name)
  const documentTitle =
    asStringOrNull(row.document_title) ??
    asStringOrNull(row.documentTitle) ??
    asStringOrNull(row.title)
  const sourceFileName =
    asStringOrNull(row.source_filename) ??
    asStringOrNull(row.sourceFileName) ??
    asStringOrNull(row.filename) ??
    asStringOrNull(row.file_name) ??
    asStringOrNull(row.name)
  const excerpt =
    asStringOrNull(row.excerpt) ??
    asStringOrNull(row.snippet) ??
    asStringOrNull(row.quote) ??
    asStringOrNull(row.chunk_preview)
  const url =
    asStringOrNull(row.url) ??
    asStringOrNull(row.href) ??
    asStringOrNull(row.link)

  return {
    index,
    displayName,
    documentTitle,
    sourceFileName,
    excerpt,
    url,
  }
}

function normalizeSources(rawSources: unknown): ChatCitationSource[] {
  if (!Array.isArray(rawSources)) return []
  const out: ChatCitationSource[] = []
  for (const [idx, row] of rawSources.entries()) {
    const source = parseCitationSource(row, idx + 1)
    if (source) out.push(source)
  }
  return out
}

/** Keys that may hold the assistant string (Disrupt + common n8n / LLM shapes). */
const ANSWER_STRING_KEYS = [
  "answer",
  "response",
  "output",
  "text",
  "content",
  "message",
  "markdown",
  "result",
] as const

const MAX_ANSWER_DEPTH = 8

function extractAnswerTextInner(node: unknown, depth: number): string {
  if (depth < 0) return ""
  if (typeof node === "string") {
    const t = node.trim()
    return t
  }

  if (Array.isArray(node)) {
    if (node.length === 1) return extractAnswerTextInner(node[0], depth - 1)
    return ""
  }

  if (node === null || typeof node !== "object") return ""

  const p = node as Record<string, unknown>

  for (const key of ANSWER_STRING_KEYS) {
    const v = p[key]
    if (typeof v === "string" && v.trim()) return v
  }

  for (const key of ANSWER_STRING_KEYS) {
    const v = p[key]
    if (v !== null && typeof v === "object") {
      const inner = extractAnswerTextInner(v, depth - 1)
      if (inner) return inner
    }
  }

  for (const wrap of ["json", "body", "data"] as const) {
    const w = p[wrap]
    if (w !== null && typeof w === "object") {
      const inner = extractAnswerTextInner(w, depth - 1)
      if (inner) return inner
    }
  }

  const choices = p.choices
  if (Array.isArray(choices) && choices.length > 0) {
    const inner = extractAnswerTextInner(choices[0], depth - 1)
    if (inner) return inner
  }

  const message = p.message
  if (message !== null && typeof message === "object") {
    const inner = extractAnswerTextInner(message, depth - 1)
    if (inner) return inner
  }

  return ""
}

function unwrapRootPayload(payload: unknown): unknown {
  if (Array.isArray(payload) && payload.length === 1) {
    return payload[0]
  }
  return payload
}

/** Merge n8n-style wrappers so `sources`, `route`, etc. resolve from inner `json` / `body`. */
function widenPayloadRoot(payload: unknown): Record<string, unknown> {
  const top = asRecord(payload ?? undefined)
  const fromData =
    top.data !== null && typeof top.data === "object" && !Array.isArray(top.data)
      ? (top.data as Record<string, unknown>)
      : {}
  const fromBody =
    top.body !== null && typeof top.body === "object" && !Array.isArray(top.body)
      ? (top.body as Record<string, unknown>)
      : {}
  const fromJson =
    top.json !== null && typeof top.json === "object" && !Array.isArray(top.json)
      ? (top.json as Record<string, unknown>)
      : {}
  return { ...fromData, ...fromBody, ...fromJson, ...top }
}

export function resultPayloadToClientShape(
  payload: unknown | null | undefined
): ChatResultForClient {
  const root = unwrapRootPayload(payload ?? undefined)
  const p = widenPayloadRoot(root)
  const answer = extractAnswerTextInner(root, MAX_ANSWER_DEPTH)

  const sources = normalizeSources(p.sources)
  const visualizations = Array.isArray(p.visualizations) ? p.visualizations : []

  return {
    answer,
    sources,
    visualizations,
    route: typeof p.route === "string" ? p.route : "",
    tool_calls_used:
      typeof p.tool_calls_used === "number" ? p.tool_calls_used : 0,
    low_base_warning: Boolean(p.low_base_warning),
    weighted: Boolean(p.weighted),
    data_source_mode:
      typeof p.data_source_mode === "string" ? p.data_source_mode : "",
  }
}
