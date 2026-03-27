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
}

export type HistoryItemResponse = {
  id: number
  user_query: string
  created_at: string
  status: string
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

/**
 * Dedupe by trimmed question text (first occurrence = most recent), cap at 20, then paginate (5 per page, max 4 pages).
 */
export function buildHistoryResponse(
  rows: ChatHistorySourceRow[],
  pageRaw: number
): {
  history: HistoryItemResponse[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
} {
  const seen = new Set<string>()
  const unique: ChatHistorySourceRow[] = []

  for (const row of rows) {
    if (row.status !== "complete") continue
    if (!hasMeaningfulPayload(row.result_payload)) continue
    const key = row.user_query.trim()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(row)
    if (unique.length >= HISTORY_MAX_ITEMS) break
  }

  const totalItems = unique.length
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
  const slice = unique.slice(start, start + HISTORY_PAGE_SIZE)

  const history: HistoryItemResponse[] = slice.map((row) => ({
    id: stableIdFromRequestId(row.request_id),
    user_query: row.user_query,
    created_at: row.created_at,
    status: "complete",
  }))

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
