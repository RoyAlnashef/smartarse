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
}

function hasMeaningfulPayload(payload: unknown): boolean {
  if (payload == null) return false
  if (typeof payload !== "object") return false
  return Object.keys(payload as object).length > 0
}

export function buildAdminHistoryResponse(input: {
  rows: AdminChatHistorySourceRow[]
  pageRaw: number
  userLabelById: Map<string, string>
}) {
  const rows: AdminChatHistoryItem[] = []
  for (const row of input.rows) {
    if (row.status !== "complete") continue
    if (!hasMeaningfulPayload(row.result_payload)) continue
    rows.push({
      request_id: row.request_id,
      user_id: row.user_id,
      user_label: input.userLabelById.get(row.user_id) ?? "Unknown user",
      user_query: row.user_query,
      created_at: row.created_at,
      status: "complete",
    })
    if (rows.length >= HISTORY_MAX_ITEMS) break
  }

  const totalItems = rows.length
  const totalPages =
    totalItems === 0
      ? 1
      : Math.min(HISTORY_MAX_PAGES, Math.ceil(totalItems / ADMIN_HISTORY_PAGE_SIZE))
  let page = Number.isFinite(input.pageRaw) ? Math.floor(input.pageRaw) : 1
  page = Math.min(Math.max(1, page), totalPages)
  const start = (page - 1) * ADMIN_HISTORY_PAGE_SIZE
  const history = rows.slice(start, start + ADMIN_HISTORY_PAGE_SIZE)

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
