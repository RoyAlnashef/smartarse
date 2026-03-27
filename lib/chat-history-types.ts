/** Past-question row from GET /api/chat/history — see chat-history-spec.md */
export interface HistoryItem {
  id: number
  user_query: string
  created_at: string
  status: string
}
