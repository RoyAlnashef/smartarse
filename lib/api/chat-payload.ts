/** Normalized assistant payload for poll / UI (see chat-history-spec.md + summary_chat_result_rows.md). */
export type ChatResultForClient = {
  answer: string
  sources: unknown[]
  visualizations: unknown[]
  route: string
  tool_calls_used: number
  low_base_warning: boolean
  weighted: boolean
  data_source_mode: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function resultPayloadToClientShape(
  payload: unknown | null | undefined
): ChatResultForClient {
  const p = asRecord(payload ?? undefined)
  const answer =
    typeof p.answer === "string"
      ? p.answer
      : typeof p.response === "string"
        ? p.response
        : typeof p.output === "string"
          ? p.output
          : ""

  const sources = Array.isArray(p.sources) ? p.sources : []
  const visualizations = Array.isArray(p.visualizations) ? p.visualizations : []

  return {
    answer,
    sources,
    visualizations,
    route: typeof p.route === "string" ? p.route : "",
    tool_calls_used:
      typeof p.tool_calls_used === "number" ? p.tool_calls_used : 0,
    low_base_warning: Boolean(p.low_base_warning),
    weighted: Boolean(p.weighted),
    data_source_mode:
      typeof p.data_source_mode === "string" ? p.data_source_mode : "",
  }
}
