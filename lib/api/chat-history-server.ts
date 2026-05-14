const HISTORY_PAGE_SIZE = 5
const HISTORY_MAX_ITEMS = 20
const HISTORY_MAX_PAGES = 4
const HISTORY_FETCH_CAP = 200

export type ChatHistorySourceRow = {
  request_id: string
  user_query: string
  created_at: string
  status: string
  result_payload: unknown
  chat_context_mode: string | null
  persona_segment_id: string | null
  persona_segment_name: string | null
  persona_segment_color_token: string | null
  custom_audience_id: string | null
  custom_audience_name: string | null
  custom_audience_child_segment_ids: string[] | null
  custom_audience_child_segment_names: string[] | null
  custom_audience_child_segment_color_tokens: string[] | null
  focus_group_session_id: string | null
  focus_group_round_number: number | null
  focus_group_participant_index: number | null
  /** When false, row is hidden from client history (filtered in SQL); present for typing parity with select. */
  show_in_chat_history?: boolean
}

export type HistoryItemResponse = {
  id: number
  request_id: string
  user_query: string
  created_at: string
  status: string
  chat_context_mode: string | null
  persona_segment_id: string | null
  persona_segment_name: string | null
  persona_segment_color_token: string | null
  custom_audience_id: string | null
  custom_audience_name: string | null
  custom_audience_child_segment_ids: string[] | null
  custom_audience_child_segment_names: string[] | null
  custom_audience_child_segment_color_tokens: string[] | null
  /** Set on focus-group group rows; collapses N participant × M round rows under one entry. */
  focus_group_session_id: string | null
  focus_group_round_count: number | null
  focus_group_participant_count: number | null
  /** Participant color tokens (segment palette tokens) in speaking order, used by the sidebar dot stack. */
  focus_group_participant_color_tokens: string[] | null
}

/** Per-session participants snapshot used to enrich focus-group history entries with colors. */
export type FocusGroupSessionSnapshot = {
  /** Color tokens in speaking order; matches `focus_group_sessions.participants[].color_token`. */
  participantColorTokens: string[]
}

/** Stable numeric id for sidebar keys (spec HistoryItem.id is number). */
export function stableIdFromRequestId(requestId: string): number {
  let h = 0
  for (let i = 0; i < requestId.length; i++) {
    h = (Math.imul(31, h) + requestId.charCodeAt(i)) | 0
  }
  return Math.abs(h) || 1
}

function hasMeaningfulPayload(payload: unknown): boolean {
  if (payload == null) return false
  if (typeof payload !== "object") return false
  return Object.keys(payload as object).length > 0
}

type FocusGroupGroup = {
  sessionId: string
  /** Display row: earliest row in the session (round 1, participant 0 when available). */
  canonicalRow: ChatHistorySourceRow
  /** Most-recent created_at across all rows in the group; drives sidebar ordering. */
  newestCreatedAt: string
  /** Count of distinct round numbers seen in the source rows. */
  roundNumbers: Set<number>
  /** Count of distinct participant indices seen in the source rows. */
  participantIndices: Set<number>
}

/**
 * Sidebar entries:
 *   - Non focus-group rows: one entry per `chat_results` row (no dedupe by question text).
 *   - Focus-group rows: collapsed into a single entry per `focus_group_session_id`.
 * Cap at 20 entries total; paginate (5 per page, max 4 pages).
 *
 * `focusGroupSessions` (optional) supplies per-session participant snapshots so
 * focus-group entries can render their dot stack with the right colors.
 */
export function buildHistoryResponse(
  rows: ChatHistorySourceRow[],
  pageRaw: number,
  focusGroupSessions?: Map<string, FocusGroupSessionSnapshot>
): {
  history: HistoryItemResponse[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
} {
  // Group focus-group rows; track standard rows separately.
  const focusGroups = new Map<string, FocusGroupGroup>()
  const standardRows: ChatHistorySourceRow[] = []

  for (const row of rows) {
    if (row.status !== "complete") continue
    if (!hasMeaningfulPayload(row.result_payload)) continue

    if (row.focus_group_session_id) {
      const existing = focusGroups.get(row.focus_group_session_id)
      if (!existing) {
        focusGroups.set(row.focus_group_session_id, {
          sessionId: row.focus_group_session_id,
          canonicalRow: row,
          newestCreatedAt: row.created_at,
          roundNumbers: new Set(
            row.focus_group_round_number != null
              ? [row.focus_group_round_number]
              : []
          ),
          participantIndices: new Set(
            row.focus_group_participant_index != null
              ? [row.focus_group_participant_index]
              : []
          ),
        })
        continue
      }
      if (row.created_at > existing.newestCreatedAt) {
        existing.newestCreatedAt = row.created_at
      }
      // Prefer the earliest round-1 participant-0 row as the display canonical;
      // fall back to the earliest row by created_at.
      const isEarlier = row.created_at < existing.canonicalRow.created_at
      const isLeadSpeaker =
        (row.focus_group_round_number ?? Number.MAX_SAFE_INTEGER) === 1 &&
        (row.focus_group_participant_index ?? Number.MAX_SAFE_INTEGER) === 0
      const canonicalIsLeadSpeaker =
        (existing.canonicalRow.focus_group_round_number ?? -1) === 1 &&
        (existing.canonicalRow.focus_group_participant_index ?? -1) === 0
      if ((isLeadSpeaker && !canonicalIsLeadSpeaker) || isEarlier) {
        existing.canonicalRow = row
      }
      if (row.focus_group_round_number != null) {
        existing.roundNumbers.add(row.focus_group_round_number)
      }
      if (row.focus_group_participant_index != null) {
        existing.participantIndices.add(row.focus_group_participant_index)
      }
      continue
    }

    standardRows.push(row)
  }

  type Entry = {
    /** Sort key — newest first. */
    sortAt: string
    /** Pre-built sidebar item. */
    item: HistoryItemResponse
  }

  const entries: Entry[] = []

  for (const row of standardRows) {
    entries.push({
      sortAt: row.created_at,
      item: {
        id: stableIdFromRequestId(row.request_id),
        request_id: row.request_id,
        user_query: row.user_query,
        created_at: row.created_at,
        status: "complete",
        chat_context_mode: row.chat_context_mode ?? null,
        persona_segment_id: row.persona_segment_id ?? null,
        persona_segment_name: row.persona_segment_name ?? null,
        persona_segment_color_token: row.persona_segment_color_token ?? null,
        custom_audience_id: row.custom_audience_id ?? null,
        custom_audience_name: row.custom_audience_name ?? null,
        custom_audience_child_segment_ids:
          row.custom_audience_child_segment_ids ?? null,
        custom_audience_child_segment_names:
          row.custom_audience_child_segment_names ?? null,
        custom_audience_child_segment_color_tokens:
          row.custom_audience_child_segment_color_tokens ?? null,
        focus_group_session_id: null,
        focus_group_round_count: null,
        focus_group_participant_count: null,
        focus_group_participant_color_tokens: null,
      },
    })
  }

  for (const group of focusGroups.values()) {
    const { canonicalRow } = group
    const snapshot = focusGroupSessions?.get(group.sessionId)
    const colorTokens = snapshot?.participantColorTokens?.length
      ? snapshot.participantColorTokens
      : null
    entries.push({
      sortAt: group.newestCreatedAt,
      item: {
        id: stableIdFromRequestId(group.sessionId),
        // Use the session id as the row request_id so the client can key on it
        // and detect "this entry is a focus group" via chat_context_mode.
        request_id: group.sessionId,
        user_query: canonicalRow.user_query,
        created_at: group.newestCreatedAt,
        status: "complete",
        chat_context_mode: "focus_group",
        persona_segment_id: null,
        persona_segment_name: null,
        persona_segment_color_token: null,
        custom_audience_id: null,
        custom_audience_name: null,
        custom_audience_child_segment_ids: null,
        custom_audience_child_segment_names: null,
        custom_audience_child_segment_color_tokens: null,
        focus_group_session_id: group.sessionId,
        focus_group_round_count: group.roundNumbers.size || null,
        // Prefer the session-snapshot count (captured at start, never
        // changes) so mid-round refreshes don't undercount participants
        // whose chat_results row hasn't reached `complete` yet. Fall back
        // to the chat_results-derived count if the snapshot is missing.
        focus_group_participant_count:
          colorTokens?.length || group.participantIndices.size || null,
        focus_group_participant_color_tokens: colorTokens,
      },
    })
  }

  entries.sort((a, b) => (a.sortAt < b.sortAt ? 1 : a.sortAt > b.sortAt ? -1 : 0))

  const capped = entries.slice(0, HISTORY_MAX_ITEMS)

  const totalItems = capped.length
  const totalPages =
    totalItems === 0
      ? 1
      : Math.min(
          HISTORY_MAX_PAGES,
          Math.ceil(totalItems / HISTORY_PAGE_SIZE)
        )

  let page = Number.isFinite(pageRaw) ? Math.floor(pageRaw) : 1
  page = Math.min(Math.max(1, page), totalPages)

  const start = (page - 1) * HISTORY_PAGE_SIZE
  const slice = capped.slice(start, start + HISTORY_PAGE_SIZE)

  const history: HistoryItemResponse[] = slice.map((entry) => entry.item)

  return {
    history,
    pagination: {
      page,
      pageSize: HISTORY_PAGE_SIZE,
      totalItems,
      totalPages,
    },
  }
}

export { HISTORY_FETCH_CAP, HISTORY_PAGE_SIZE, HISTORY_MAX_ITEMS }
