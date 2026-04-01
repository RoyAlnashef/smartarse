/** Past-question row from GET /api/chat/history — see chat-history-spec.md */
export interface HistoryItem {
  /** Legacy numeric key; prefer `request_id` for React keys and fetches. */
  id: number
  /** Stable thread anchor / row id for hydration (UUID). */
  request_id: string
  user_query: string
  created_at: string
  status: string
}

export interface HistoryResponse {
  history: HistoryItem[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}
