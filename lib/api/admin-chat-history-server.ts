import { HISTORY_FETCH_CAP } from "@/lib/api/chat-history-server"
import type { AdminChatHistoryItem } from "@/lib/admin-chat-history-types"

const HISTORY_MAX_ITEMS = 100
const HISTORY_MAX_PAGES = 20
const ADMIN_HISTORY_PAGE_SIZE = 12

export type AdminChatHistorySourceRow = {
  request_id: string
  user_id: string
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
}

/** Per-session participants snapshot used to enrich focus-group history entries with colors. */
export type AdminFocusGroupSessionSnapshot = {
  /** Color tokens in speaking order; matches `focus_group_sessions.participants[].color_token`. */
  participantColorTokens: string[]
}

function hasMeaningfulPayload(payload: unknown): boolean {
  if (payload == null) return false
  if (typeof payload !== "object") return false
  return Object.keys(payload as object).length > 0
}

type FocusGroupGroup = {
  sessionId: string
  /** Display row: earliest row in the session (round 1, participant 0 when available). */
  canonicalRow: AdminChatHistorySourceRow
  /** Most-recent created_at across all rows in the group; drives sidebar ordering. */
  newestCreatedAt: string
  /** Count of distinct round numbers seen in the source rows. */
  roundNumbers: Set<number>
  /** Count of distinct participant indices seen in the source rows. */
  participantIndices: Set<number>
}

/**
 * Admin history entries:
 *   - Non focus-group rows: one entry per `chat_results` row.
 *   - Focus-group rows: collapsed into a single entry per `focus_group_session_id`,
 *     mirroring the client-facing grouping in `lib/api/chat-history-server.ts`.
 *
 * `focusGroupSessions` (optional) supplies per-session participant snapshots so
 * focus-group entries can render their dot stack with the right colors and the
 * tooltip count is accurate even when a round is still mid-flight.
 */
export function buildAdminHistoryResponse(input: {
  rows: AdminChatHistorySourceRow[]
  pageRaw: number
  userLabelById: Map<string, string>
  focusGroupSessions?: Map<string, AdminFocusGroupSessionSnapshot>
}) {
  const focusGroups = new Map<string, FocusGroupGroup>()
  const standardRows: AdminChatHistorySourceRow[] = []

  for (const row of input.rows) {
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
    sortAt: string
    item: AdminChatHistoryItem
  }

  const entries: Entry[] = []

  for (const row of standardRows) {
    entries.push({
      sortAt: row.created_at,
      item: {
        request_id: row.request_id,
        user_id: row.user_id,
        user_label: input.userLabelById.get(row.user_id) ?? "Unknown user",
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
    const snapshot = input.focusGroupSessions?.get(group.sessionId)
    const colorTokens = snapshot?.participantColorTokens?.length
      ? snapshot.participantColorTokens
      : null
    entries.push({
      sortAt: group.newestCreatedAt,
      item: {
        // Use the session id as the row request_id so the client can key on it
        // and detect "this entry is a focus group" via chat_context_mode.
        request_id: group.sessionId,
        user_id: canonicalRow.user_id,
        user_label:
          input.userLabelById.get(canonicalRow.user_id) ?? "Unknown user",
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
        // Prefer the session-snapshot count (captured at start, never changes)
        // so mid-round refreshes don't undercount participants whose
        // chat_results row hasn't reached `complete` yet.
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
      : Math.min(HISTORY_MAX_PAGES, Math.ceil(totalItems / ADMIN_HISTORY_PAGE_SIZE))
  let page = Number.isFinite(input.pageRaw) ? Math.floor(input.pageRaw) : 1
  page = Math.min(Math.max(1, page), totalPages)
  const start = (page - 1) * ADMIN_HISTORY_PAGE_SIZE
  const history = capped.slice(start, start + ADMIN_HISTORY_PAGE_SIZE).map((e) => e.item)

  const users = [...input.userLabelById.entries()]
    .map(([user_id, user_label]) => ({ user_id, user_label }))
    .sort((a, b) => a.user_label.localeCompare(b.user_label))

  return {
    history,
    users,
    pagination: {
      page,
      pageSize: ADMIN_HISTORY_PAGE_SIZE,
      totalItems,
      totalPages,
    },
  }
}

export { HISTORY_FETCH_CAP }
