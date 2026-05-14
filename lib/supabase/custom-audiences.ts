import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  CustomAudienceChildSegment,
  CustomAudienceDefinitionSnapshot,
  CustomAudienceFilters,
  SavedCustomAudience,
} from "@/lib/types"
import {
  SEGMENT_BRAND_DEFAULT_COLOR_TOKEN,
  isCiteColorToken,
} from "@/lib/theme/cite-color-tokens"

export { MAX_SAVED_CUSTOM_AUDIENCES_PER_USER } from "@/lib/audience/constants"

export type ProjectCustomAudienceRow = {
  id: string
  project_id: string
  organization_id: string
  created_by: string | null
  name: string
  description: string | null
  filters_summary: string | null
  filters: unknown
  child_segments: unknown
  child_segment_color_tokens: string[] | null
  base_size: number | null
  avg_concern: number | null
  created_at: string
  updated_at: string
}

const projectCustomAudienceSelect =
  "id,project_id,organization_id,created_by,name,description,filters_summary,filters,child_segments,child_segment_color_tokens,base_size,avg_concern,created_at,updated_at"

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asColorTokenArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry))
}

function normalizeChildSegments(raw: unknown): CustomAudienceChildSegment[] {
  if (!Array.isArray(raw)) return []
  const out: CustomAudienceChildSegment[] = []
  for (const entry of raw) {
    const row = asRecord(entry)
    const id = asString(row.id)
    const name = asString(row.name)
    if (!id || !name) continue
    out.push({
      id,
      name,
      colorToken: asString(row.color_token) ?? asString(row.colorToken),
    })
  }
  return out
}

function normalizeFilters(raw: unknown): CustomAudienceFilters {
  const row = asRecord(raw)
  return row as CustomAudienceFilters
}

function rowToSavedCustomAudience(row: ProjectCustomAudienceRow): SavedCustomAudience {
  const childSegments = normalizeChildSegments(row.child_segments)
  const childSegmentColorTokens =
    childSegments.length > 0
      ? childSegments.map((segment) => {
          const t = segment.colorToken?.trim()
          if (
            t &&
            (isCiteColorToken(t) || t === SEGMENT_BRAND_DEFAULT_COLOR_TOKEN)
          ) {
            return t
          }
          return SEGMENT_BRAND_DEFAULT_COLOR_TOKEN
        })
      : asColorTokenArray(row.child_segment_color_tokens)

  return {
    id: row.id,
    projectId: row.project_id,
    organizationId: row.organization_id,
    createdBy: row.created_by,
    name: row.name,
    description: row.description,
    filtersSummary: row.filters_summary,
    baseSize: row.base_size,
    avgConcern: row.avg_concern,
    snapshot: {
      filters: normalizeFilters(row.filters),
      childSegments,
    },
    childSegmentColorTokens,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export type UpsertSavedCustomAudienceInput = {
  id?: string
  projectId: string
  organizationId: string
  createdBy: string
  name: string
  description?: string | null
  filtersSummary?: string | null
  baseSize?: number | null
  avgConcern?: number | null
  snapshot: CustomAudienceDefinitionSnapshot
}

function snapshotToChildSegmentRows(snapshot: CustomAudienceDefinitionSnapshot): {
  childSegments: Array<{ id: string; name: string; color_token: string | null }>
  childSegmentColorTokens: string[]
} {
  const childSegments = snapshot.childSegments.map((segment) => ({
    id: segment.id,
    name: segment.name,
    color_token: segment.colorToken ?? null,
  }))
  const childSegmentColorTokens = snapshot.childSegments.map((segment) => {
    const t = segment.colorToken?.trim()
    if (
      t &&
      (isCiteColorToken(t) || t === SEGMENT_BRAND_DEFAULT_COLOR_TOKEN)
    ) {
      return t
    }
    return SEGMENT_BRAND_DEFAULT_COLOR_TOKEN
  })
  return { childSegments, childSegmentColorTokens }
}

export async function countSavedCustomAudiencesForUser(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("project_custom_audiences")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("created_by", userId)

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function listSavedCustomAudiences(
  supabase: SupabaseClient,
  projectId: string
): Promise<SavedCustomAudience[]> {
  const { data, error } = await supabase
    .from("project_custom_audiences")
    .select(projectCustomAudienceSelect)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) =>
    rowToSavedCustomAudience(row as ProjectCustomAudienceRow)
  )
}

export async function getSavedCustomAudienceById(
  supabase: SupabaseClient,
  id: string
): Promise<SavedCustomAudience | null> {
  const { data, error } = await supabase
    .from("project_custom_audiences")
    .select(projectCustomAudienceSelect)
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return rowToSavedCustomAudience(data as ProjectCustomAudienceRow)
}

export async function createSavedCustomAudience(
  supabase: SupabaseClient,
  input: UpsertSavedCustomAudienceInput
): Promise<SavedCustomAudience> {
  const { childSegments, childSegmentColorTokens } = snapshotToChildSegmentRows(
    input.snapshot
  )

  const { data, error } = await supabase
    .from("project_custom_audiences")
    .insert({
      project_id: input.projectId,
      organization_id: input.organizationId,
      created_by: input.createdBy,
      name: input.name,
      description: input.description ?? null,
      filters_summary: input.filtersSummary ?? null,
      filters: input.snapshot.filters,
      child_segments: childSegments,
      child_segment_color_tokens: childSegmentColorTokens,
      base_size: input.baseSize ?? null,
      avg_concern: input.avgConcern ?? null,
    })
    .select(projectCustomAudienceSelect)
    .single()

  if (error) throw new Error(error.message)
  return rowToSavedCustomAudience(data as ProjectCustomAudienceRow)
}

export async function deleteSavedCustomAudience(
  supabase: SupabaseClient,
  id: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("project_custom_audiences")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error) throw new Error(error.message)
  return Boolean(data)
}

export async function updateSavedCustomAudience(
  supabase: SupabaseClient,
  id: string,
  input: Omit<UpsertSavedCustomAudienceInput, "createdBy" | "projectId" | "organizationId">
): Promise<SavedCustomAudience> {
  const { childSegments, childSegmentColorTokens } = snapshotToChildSegmentRows(
    input.snapshot
  )

  const { data, error } = await supabase
    .from("project_custom_audiences")
    .update({
      name: input.name,
      description: input.description ?? null,
      filters_summary: input.filtersSummary ?? null,
      filters: input.snapshot.filters,
      child_segments: childSegments,
      child_segment_color_tokens: childSegmentColorTokens,
      base_size: input.baseSize ?? null,
      avg_concern: input.avgConcern ?? null,
    })
    .eq("id", id)
    .select(projectCustomAudienceSelect)
    .single()

  if (error) throw new Error(error.message)
  return rowToSavedCustomAudience(data as ProjectCustomAudienceRow)
}
