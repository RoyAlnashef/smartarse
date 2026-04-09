export type AdminChatHistoryItem = {
  request_id: string
  user_id: string
  user_label: string
  user_query: string
  created_at: string
  status: "complete"
}

export type AdminChatHistoryPagination = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type AdminChatHistoryResponse = {
  history: AdminChatHistoryItem[]
  users: { user_id: string; user_label: string }[]
  pagination: AdminChatHistoryPagination
}

export type AdminChatResultRow = {
  request_id: string
  user_id: string
  user_label: string
  user_query: string
  created_at: string
  status: string
  result_payload: unknown
}
