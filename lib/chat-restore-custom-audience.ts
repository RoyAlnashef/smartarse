import type { SavedCustomAudience } from "@/lib/types"

/** Synthetic id prefix when `chat_results.custom_audience_id` was cleared (e.g. saved row deleted). */
export const ARCHIVED_CUSTOM_AUDIENCE_ID_PREFIX = "archived:" as const

/** Client-only temp id while exploring before a row exists in `project_custom_audiences`. */
export const DRAFT_CUSTOM_AUDIENCE_ID_PREFIX = "draft-" as const

export function isArchivedCustomAudienceId(id: string): boolean {
  return id.startsWith(ARCHIVED_CUSTOM_AUDIENCE_ID_PREFIX)
}

export function isDraftCustomAudienceId(id: string): boolean {
  return id.startsWith(DRAFT_CUSTOM_AUDIENCE_ID_PREFIX)
}

/** Denormalized custom-audience fields from `chat_results` or history API rows. */
export type CustomAudienceDenormSource = {
  request_id: string
  chat_context_mode?: "default" | "persona_segment" | "custom_audience" | null
  custom_audience_id: string | null
  custom_audience_name: string | null
  custom_audience_child_segment_ids: string[] | null
  custom_audience_child_segment_names: string[] | null
  custom_audience_child_segment_color_tokens: string[] | null
}

/**
 * Build a `SavedCustomAudience` for UI hydration from anchor denormalized columns
 * when the `project_custom_audiences` row may no longer exist.
 */
export function ghostCustomAudienceFromChatRow(
  row: CustomAudienceDenormSource,
  projectId: string,
  createdAt: string
): SavedCustomAudience | null {
  if (row.chat_context_mode === "persona_segment") {
    return null
  }

  const hasName = Boolean(row.custom_audience_name?.trim())
  const hasSegments = (row.custom_audience_child_segment_ids?.length ?? 0) > 0
  const modeCustom = row.chat_context_mode === "custom_audience"

  if (!modeCustom && !hasName && !hasSegments) {
    return null
  }

  const ids = row.custom_audience_child_segment_ids ?? []
  const childSegments = ids.map((segmentId, index) => ({
    id: segmentId,
    name:
      row.custom_audience_child_segment_names?.[index] ?? `Segment ${index + 1}`,
    colorToken: row.custom_audience_child_segment_color_tokens?.[index] ?? null,
  }))

  const filters: Record<string, unknown> = {}
  if (ids.length > 0) {
    filters.segment_ids = [...ids]
  }

  return {
    id: row.custom_audience_id ?? `${ARCHIVED_CUSTOM_AUDIENCE_ID_PREFIX}${row.request_id}`,
    projectId,
    organizationId: "",
    createdBy: null,
    name: row.custom_audience_name?.trim() || "Custom audience",
    description: null,
    filtersSummary: null,
    baseSize: null,
    avgConcern: null,
    snapshot: {
      filters,
      childSegments,
    },
    childSegmentColorTokens: row.custom_audience_child_segment_color_tokens ?? [],
    createdAt,
    updatedAt: createdAt,
  }
}
