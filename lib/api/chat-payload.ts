/** Normalized assistant payload for poll / UI (see chat-history-spec.md + summary_chat_result_rows.md). */
import type {
  ChatCitationSource,
  ChatInlineCitation,
  InterviewChunkData,
  SurveyChunkData,
} from "@/lib/types"

export type { ChatInlineCitation }

export type ChatResultForClient = {
  answer: string
  sources: ChatCitationSource[]
  /** Per-marker citation rows (Phase 1: survey only); empty when payload omits them. */
  inlineCitations: ChatInlineCitation[]
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

function asTextOrNull(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return asStringOrNull(value)
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function asStringArrayOrNull(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const out: string[] = []
  for (const item of value) {
    const s = asStringOrNull(item)
    if (s) out.push(s)
  }
  return out.length > 0 ? out : null
}

function parseInterviewChunk(raw: unknown): InterviewChunkData | null {
  const row = asRecord(raw)
  if (Object.keys(row).length === 0) return null
  const respondent_id =
    asStringOrNull(row.respondent_id) ??
    asStringOrNull(row.respondentId) ??
    asStringOrNull(row.interview_id) ??
    asStringOrNull(row.interviewId)
  const interview_country =
    asStringOrNull(row.interview_country) ??
    asStringOrNull(row.interviewCountry) ??
    asStringOrNull(row.country)
  const interview_gender =
    asStringOrNull(row.interview_gender) ??
    asStringOrNull(row.interviewGender) ??
    asStringOrNull(row.gender) ??
    asStringOrNull(row.gender_label) ??
    asStringOrNull(row.genderLabel)
  const interview_age =
    asStringOrNull(row.interview_age) ??
    asStringOrNull(row.interviewAge) ??
    asStringOrNull(row.age) ??
    asStringOrNull(row.age_band) ??
    asStringOrNull(row.ageBand)
  const interview_segment =
    asStringOrNull(row.interview_segment) ??
    asStringOrNull(row.interviewSegment) ??
    asStringOrNull(row.segment_name) ??
    asStringOrNull(row.segmentName) ??
    asStringOrNull(row.segment)
  const moderator_question =
    asStringOrNull(row.moderator_question) ??
    asStringOrNull(row.moderatorQuestion) ??
    asStringOrNull(row.question)
  const chunk_preview =
    asStringOrNull(row.chunk_preview) ??
    asStringOrNull(row.chunkPreview) ??
    asStringOrNull(row.preview) ??
    asStringOrNull(row.excerpt) ??
    asStringOrNull(row.content)
  const similarity =
    asNumber(row.similarity) ?? asNumber(row.score) ?? asNumber(row.relevance)

  return {
    respondent_id,
    interview_country,
    interview_gender,
    interview_age,
    interview_segment,
    moderator_question,
    chunk_preview,
    similarity,
  }
}

function normalizeInterviewChunks(raw: unknown): InterviewChunkData[] | null {
  if (!Array.isArray(raw)) return null
  const out: InterviewChunkData[] = []
  for (const item of raw) {
    const chunk = parseInterviewChunk(item)
    if (chunk) out.push(chunk)
  }
  return out.length > 0 ? out : null
}

function parseSurveyChunk(raw: unknown): SurveyChunkData | null {
  const row = asRecord(raw)
  if (Object.keys(row).length === 0) return null
  const verbatim =
    asStringOrNull(row.verbatim) ??
    asStringOrNull(row.response) ??
    asStringOrNull(row.text) ??
    asStringOrNull(row.quote)
  const question_code =
    asStringOrNull(row.question_code) ??
    asStringOrNull(row.questionCode) ??
    asStringOrNull(row.q_code) ??
    asStringOrNull(row.qCode)
  const question_text =
    asStringOrNull(row.question_text) ??
    asStringOrNull(row.questionText) ??
    asStringOrNull(row.question)
  const country =
    asStringOrNull(row.country) ??
    asStringOrNull(row.interview_country) ??
    asStringOrNull(row.interviewCountry)
  const gender_label =
    asStringOrNull(row.gender_label) ??
    asStringOrNull(row.genderLabel) ??
    asStringOrNull(row.gender)
  const age_band =
    asStringOrNull(row.age_band) ??
    asStringOrNull(row.ageBand) ??
    asStringOrNull(row.age)
  const segment_name =
    asStringOrNull(row.segment_name) ??
    asStringOrNull(row.segmentName) ??
    asStringOrNull(row.segment)

  if (
    !verbatim &&
    !question_code &&
    !question_text &&
    !country &&
    !gender_label &&
    !age_band &&
    !segment_name
  ) {
    return null
  }

  return {
    verbatim,
    question_code,
    question_text,
    country,
    gender_label,
    age_band,
    segment_name,
  }
}

function normalizeSurveyChunks(raw: unknown): SurveyChunkData[] | null {
  if (!Array.isArray(raw)) return null
  const out: SurveyChunkData[] = []
  for (const item of raw) {
    const chunk = parseSurveyChunk(item)
    if (chunk) out.push(chunk)
  }
  return out.length > 0 ? out : null
}

export function parseCitationSource(raw: unknown, fallbackIndex: number): ChatCitationSource | null {
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
  const sourceType =
    asStringOrNull(row.source_type) ??
    asStringOrNull(row.sourceType) ??
    asStringOrNull(row.type)
  const sourceCategory =
    asStringOrNull(row.source_category) ??
    asStringOrNull(row.sourceCategory) ??
    asStringOrNull(row.category)
  const questionCode =
    asStringOrNull(row.question_code) ??
    asStringOrNull(row.questionCode) ??
    asStringOrNull(row.q_code) ??
    asStringOrNull(row.qCode) ??
    asStringOrNull(row.code)
  const questionCodes =
    asStringArrayOrNull(row.question_codes) ??
    asStringArrayOrNull(row.questionCodes)
  const questionText =
    asStringOrNull(row.question_text) ??
    asStringOrNull(row.questionText) ??
    asStringOrNull(row.question) ??
    asStringOrNull(row.prompt)
  const respondentGroup =
    asStringOrNull(row.respondent_group) ??
    asStringOrNull(row.respondentGroup) ??
    asStringOrNull(row.audience) ??
    asStringOrNull(row.segment)
  const sampleSize =
    asTextOrNull(row.sample_size) ??
    asTextOrNull(row.sampleSize) ??
    asTextOrNull(row.n_size) ??
    asTextOrNull(row.n) ??
    asTextOrNull(row.total_n) ??
    asTextOrNull(row.totalN)
  const sampleDescription =
    asStringOrNull(row.sample_description) ??
    asStringOrNull(row.sampleDescription) ??
    asStringOrNull(row.respondent_description) ??
    asStringOrNull(row.respondentDescription)
  const baseSizeRaw =
    row.base_size ??
    row.baseSize ??
    row.total_respondents ??
    row.totalRespondents ??
    row.respondent_count ??
    row.respondentCount ??
    row.n_respondents ??
    row.nRespondents ??
    row.weighted_base ??
    row.weightedBase ??
    row.weighted_n ??
    row.weightedN ??
    row.sample_count ??
    row.sampleCount
  const baseSize: number | string | null =
    typeof baseSizeRaw === "number" && Number.isFinite(baseSizeRaw)
      ? baseSizeRaw
      : asStringOrNull(baseSizeRaw)
  const chunkTopic =
    asStringOrNull(row.chunk_topic) ??
    asStringOrNull(row.chunkTopic) ??
    asStringOrNull(row.topic_label) ??
    asStringOrNull(row.topicLabel)
  const variablesUsed = Array.isArray(row.variables_used)
    ? row.variables_used
        .map((value) => asStringOrNull(value))
        .filter((value): value is string => Boolean(value))
        .join(", ") || null
    : asStringOrNull(row.variables_used) ??
      asStringOrNull(row.variablesUsed) ??
      asStringOrNull(row.variables)
  const recordManagerId =
    asStringOrNull(row.record_manager_id) ??
    asStringOrNull(row.recordManagerId)
  const iconName =
    asStringOrNull(row.icon_name) ??
    asStringOrNull(row.iconName) ??
    asStringOrNull(row.source_icon) ??
    asStringOrNull(row.sourceIcon)
  const iconType =
    asStringOrNull(row.icon_type) ??
    asStringOrNull(row.iconType)
  const iconUrl =
    asStringOrNull(row.icon_url) ??
    asStringOrNull(row.iconUrl) ??
    asStringOrNull(row.source_icon_url) ??
    asStringOrNull(row.sourceIconUrl)
  const citeColorToken =
    asStringOrNull(row.cite_color_token) ??
    asStringOrNull(row.citeColorToken) ??
    asStringOrNull(row.source_cite_color_token)
  const interviewChunks = normalizeInterviewChunks(
    row.interview_chunks_data ?? row.interviewChunks ?? row.interviewChunksData
  )
  const surveyChunks = normalizeSurveyChunks(
    row.survey_chunks_data ?? row.surveyChunks ?? row.surveyChunksData
  )
  const quoteCount =
    asNumber(row.quote_count) ??
    asNumber(row.quoteCount) ??
    (interviewChunks ? interviewChunks.length : null)

  return {
    index,
    displayName,
    documentTitle,
    sourceFileName,
    excerpt,
    url,
    sourceType,
    sourceCategory,
    questionCode,
    questionCodes,
    questionText,
    respondentGroup,
    sampleSize,
    sampleDescription,
    baseSize,
    variablesUsed,
    recordManagerId,
    iconName,
    iconType,
    iconUrl,
    citeColorToken,
    chunkTopic,
    interviewChunks,
    quoteCount,
    surveyChunks,
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

/**
 * Validate / coerce per-marker citation rows from Disrupt `inline_citations`
 * (or camelCase `inlineCitations`). Output is sorted by `marker_position` so
 * the consumer can pair the Nth `[k]` occurrence with the Nth row whose
 * `sourceIndex === k`. Rows missing `marker_position` get a stable fallback
 * derived from their input order so they sort after explicit positions.
 */
export function normalizeInlineCitations(raw: unknown): ChatInlineCitation[] {
  if (!Array.isArray(raw)) return []
  const out: ChatInlineCitation[] = []
  for (const [idx, item] of raw.entries()) {
    const row = asRecord(item)
    const sourceIndex =
      asNumber(row.source_index) ??
      asNumber(row.sourceIndex) ??
      asNumber(row.index) ??
      asNumber(row.citation_index)
    if (sourceIndex == null || !Number.isInteger(sourceIndex) || sourceIndex < 1) {
      continue
    }
    const markerPositionRaw =
      asNumber(row.marker_position) ?? asNumber(row.markerPosition)
    const marker_position =
      markerPositionRaw != null ? markerPositionRaw : Number.MAX_SAFE_INTEGER - idx
    const q_codes =
      asStringArrayOrNull(row.q_codes) ?? asStringArrayOrNull(row.qCodes)
    const questionText =
      asStringOrNull(row.question_text) ??
      asStringOrNull(row.questionText) ??
      asStringOrNull(row.question) ??
      asStringOrNull(row.prompt)
    out.push({
      sourceIndex,
      marker_position,
      q_codes,
      questionText,
    })
  }
  out.sort((a, b) => a.marker_position - b.marker_position)
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
  const inlineCitations = normalizeInlineCitations(
    p.inline_citations ?? p.inlineCitations
  )
  const visualizations = Array.isArray(p.visualizations) ? p.visualizations : []

  return {
    answer,
    sources,
    inlineCitations,
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
