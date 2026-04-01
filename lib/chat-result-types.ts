/** Row shape from GET /api/chat/result */
export type ChatResultRow = {
  request_id: string
  user_query: string
  created_at: string
  status: string
  result_payload: unknown
}
