export type AdminChatHistoryItem = {
  request_id: string
  user_id: string
  user_label: string
  user_query: string
  created_at: string
  status: "complete"
  /** When `"focus_group"`, this entry collapses an entire focus-group session under one row. */
  chat_context_mode?: string | null
  persona_segment_id: string | null
  persona_segment_name: string | null
  persona_segment_color_token: string | null
  custom_audience_id?: string | null
  custom_audience_name?: string | null
  custom_audience_child_segment_ids?: string[] | null
  custom_audience_child_segment_names?: string[] | null
  custom_audience_child_segment_color_tokens?: string[] | null
  /** Set only on focus-group entries; matches `focus_group_sessions.id`. */
  focus_group_session_id?: string | null
  focus_group_round_count?: number | null
  focus_group_participant_count?: number | null
  /** Cite-palette color tokens for each focus-group participant in speaking order (for the sidebar dot stack). */
  focus_group_participant_color_tokens?: string[] | null
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
  persona_segment_id: string | null
  persona_segment_name: string | null
  persona_segment_color_token: string | null
  custom_audience_id?: string | null
  custom_audience_name?: string | null
  custom_audience_child_segment_ids?: string[] | null
  custom_audience_child_segment_names?: string[] | null
  custom_audience_child_segment_color_tokens?: string[] | null
}
