/** Row shape from GET /api/chat/result */
export type ChatResultRow = {
  request_id: string
  user_query: string
  created_at: string
  status: string
  result_payload: unknown
  persona_segment_id: string | null
  persona_segment_name: string | null
  persona_segment_color_token: string | null
  custom_audience_id: string | null
  custom_audience_name: string | null
  custom_audience_child_segment_ids: string[] | null
  custom_audience_child_segment_names: string[] | null
  custom_audience_child_segment_color_tokens: string[] | null
  chat_context_mode?: "default" | "persona_segment" | "custom_audience" | null
}
