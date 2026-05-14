import { NextResponse } from "next/server"
import { z } from "zod"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"
import {
  attachMergeMeta,
  mergeCompletedJobIntoAnchor,
} from "@/lib/api/chat-anchor-merge"
import {
  ensureActivationPrefixInResultRecord,
  type ContextActivationDenorm,
} from "@/lib/chat-thread"
import { PROJECT_NOT_LIVE_CHAT_MESSAGE } from "@/lib/project-status"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { segmentColorTokenForDatabase } from "@/lib/theme/cite-color-tokens"

const persistBodySchema = z.object({
  request_id: z.string().uuid(),
  project_id: z.string().uuid(),
  user_query: z.string().trim().min(1).max(50_000),
  result: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["complete", "error_fallback", "pending"]).optional(),
  weighted: z.boolean().nullable().optional(),
  data_source_mode: z.string().max(120).nullable().optional(),
  system_version: z.string().max(64).nullable().optional(),
  is_cacheable: z.boolean().optional(),
  cache_hit_count: z.number().int().min(0).optional(),
  persona_segment_id: z.string().max(120).nullable().optional(),
  persona_segment_name: z.string().max(300).nullable().optional(),
  persona_segment_color_token: z.string().max(64).nullable().optional(),
  custom_audience_id: z.string().uuid().nullable().optional(),
  custom_audience_name: z.string().max(300).nullable().optional(),
  custom_audience_child_segment_ids: z.array(z.string().max(120)).nullable().optional(),
  custom_audience_child_segment_names: z.array(z.string().max(300)).nullable().optional(),
  custom_audience_child_segment_color_tokens: z
    .array(z.string().max(64).nullable())
    .nullable()
    .optional(),
  chat_context_mode: z
    .enum(["default", "persona_segment", "custom_audience", "focus_group"])
    .optional(),
  /** When set, merge this job into the anchor row and remove the ephemeral `request_id` row. */
  thread_anchor_request_id: z.string().uuid().optional(),
  merge_user_timestamp: z.string().optional(),
  merge_assistant_timestamp: z.string().optional(),
  /** When false, row is hidden from client chat history until promoted (draft custom-audience explore). */
  show_in_chat_history: z.boolean().optional(),
  /** Focus-group tagging — set on per-participant response rows only. */
  focus_group_session_id: z.string().uuid().nullable().optional(),
  focus_group_round_number: z.number().int().min(1).nullable().optional(),
  focus_group_participant_index: z
    .number()
    .int()
    .min(0)
    .nullable()
    .optional(),
})

function pickDenormFromResult(
  result: Record<string, unknown> | undefined,
  key: "weighted" | "data_source_mode"
): unknown {
  if (!result) return undefined
  return result[key]
}

const FALLBACK_DATA_SOURCE_MODE = "both"

export async function POST(request: Request) {
  const parsed = persistBodySchema.safeParse(await request.json())
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json<ApiError>(
      { error: first?.message ?? "Invalid request body." },
      { status: 400 }
    )
  }

  const session = await requireChatSession(request)
  if (session instanceof NextResponse) {
    return session
  }

  const { supabase, profile } = session
  const body = parsed.data

  let admin
  try {
    admin = getSupabaseAdminClient()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Server configuration error."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }

  const { error: pauseRpcError } = await admin.rpc(
    "pause_project_if_access_expired",
    { p_project_id: body.project_id }
  )
  if (pauseRpcError) {
    return NextResponse.json<ApiError>(
      { error: pauseRpcError.message ?? "Could not verify project access." },
      { status: 500 }
    )
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, organization_id, status")
    .eq("id", body.project_id)
    .maybeSingle()

  if (projectError || !project) {
    return NextResponse.json<ApiError>(
      { error: "Project not found." },
      { status: 404 }
    )
  }

  if ((project as { status: string }).status !== "live") {
    return NextResponse.json<ApiError>(
      { error: PROJECT_NOT_LIVE_CHAT_MESSAGE },
      { status: 403 }
    )
  }

  const { data: existing } = await admin
    .from("chat_results")
    .select("user_id, status")
    .eq("request_id", body.request_id)
    .maybeSingle()

  if (
    existing?.user_id != null &&
    existing.user_id !== profile.id
  ) {
    return NextResponse.json<ApiError>(
      { error: "Forbidden." },
      { status: 403 }
    )
  }

  let resultObj: Record<string, unknown> = { ...(body.result ?? {}) }
  const status = body.status ?? "complete"
  const anchorId = body.thread_anchor_request_id
  const showInChatHistory = body.show_in_chat_history ?? true

  if (
    !anchorId &&
    (status === "complete" || status === "error_fallback")
  ) {
    const mode = body.chat_context_mode ?? "default"
    // Focus-group response rows are standalone (one row per participant,
    // grouped via focus_group_session_id) and never need an activation prefix.
    if (mode === "persona_segment" || mode === "custom_audience") {
      const denorm: ContextActivationDenorm = {
        chatContextMode: mode,
        personaSegmentId: body.persona_segment_id ?? null,
        customAudienceId: body.custom_audience_id ?? null,
        customAudienceName: body.custom_audience_name ?? null,
        customAudienceChildSegmentNames:
          body.custom_audience_child_segment_names ?? null,
        requestIdForActivationId: body.request_id,
      }
      resultObj = ensureActivationPrefixInResultRecord(resultObj, {
        user_query: body.user_query,
        firstUserTimestamp:
          body.merge_user_timestamp?.trim() || new Date().toISOString(),
        denorm,
      })
    }
  }

  if (
    existing?.status === "cancelled" &&
    (status === "complete" || status === "error_fallback")
  ) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  if (anchorId && status !== "pending") {
    if (anchorId === body.request_id) {
      return NextResponse.json<ApiError>(
        { error: "thread_anchor_request_id must differ from request_id." },
        { status: 400 }
      )
    }

    const merged = await mergeCompletedJobIntoAnchor({
      admin,
      actorUserId: profile.id,
      organizationId: project.organization_id as string,
      projectId: body.project_id,
      anchorRequestId: anchorId,
      jobRequestId: body.request_id,
      followUpUserQuestion: body.user_query,
      newResult: resultObj,
      status,
      systemVersion: body.system_version ?? null,
      personaSegmentId: body.persona_segment_id,
      personaSegmentName: body.persona_segment_name,
      personaSegmentColorToken: segmentColorTokenForDatabase(
        body.persona_segment_color_token ?? null
      ),
      customAudienceId: body.custom_audience_id,
      customAudienceName: body.custom_audience_name,
      customAudienceChildSegmentIds: body.custom_audience_child_segment_ids,
      customAudienceChildSegmentNames: body.custom_audience_child_segment_names,
      customAudienceChildSegmentColorTokens:
        body.custom_audience_child_segment_color_tokens?.map((t) =>
          segmentColorTokenForDatabase(t)
        ) ?? null,
      // Focus-group rows are never merged into an anchor (each participant is
      // a standalone row); collapse to "default" if it leaks through here.
      chatContextMode:
        body.chat_context_mode === "focus_group"
          ? "default"
          : body.chat_context_mode,
      userTimestamp: body.merge_user_timestamp,
      assistantTimestamp: body.merge_assistant_timestamp,
      showInChatHistory,
    })

    if (!merged.ok) {
      return NextResponse.json<ApiError>(
        { error: merged.error },
        { status: merged.status }
      )
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const weighted =
    body.weighted !== undefined
      ? body.weighted
      : typeof pickDenormFromResult(resultObj, "weighted") === "boolean"
        ? (pickDenormFromResult(resultObj, "weighted") as boolean)
        : null

  const dataSourceMode =
    body.data_source_mode !== undefined
      ? body.data_source_mode
      : typeof pickDenormFromResult(resultObj, "data_source_mode") === "string"
        ? (pickDenormFromResult(resultObj, "data_source_mode") as string)
        : FALLBACK_DATA_SOURCE_MODE

  const row = {
    request_id: body.request_id,
    organization_id: project.organization_id,
    project_id: body.project_id,
    user_id: profile.id,
    user_query: body.user_query,
    status,
    result_payload: attachMergeMeta({
      result: resultObj,
      threadAnchorRequestId: anchorId,
      mergeUserTimestamp: body.merge_user_timestamp,
      mergeAssistantTimestamp: body.merge_assistant_timestamp,
    }),
    weighted,
    data_source_mode: dataSourceMode ?? FALLBACK_DATA_SOURCE_MODE,
    system_version: body.system_version ?? null,
    is_cacheable: body.is_cacheable ?? false,
    cache_hit_count: body.cache_hit_count ?? 0,
    persona_segment_id: body.persona_segment_id ?? null,
    persona_segment_name: body.persona_segment_name ?? null,
    persona_segment_color_token: segmentColorTokenForDatabase(
      body.persona_segment_color_token ?? null
    ),
    custom_audience_id: body.custom_audience_id ?? null,
    custom_audience_name: body.custom_audience_name ?? null,
    custom_audience_child_segment_ids:
      body.custom_audience_child_segment_ids ?? null,
    custom_audience_child_segment_names:
      body.custom_audience_child_segment_names ?? null,
    custom_audience_child_segment_color_tokens:
      body.custom_audience_child_segment_color_tokens?.map((t) =>
        segmentColorTokenForDatabase(t)
      ) ?? null,
    chat_context_mode: body.chat_context_mode ?? "default",
    show_in_chat_history: showInChatHistory,
    focus_group_session_id: body.focus_group_session_id ?? null,
    focus_group_round_number: body.focus_group_round_number ?? null,
    focus_group_participant_index: body.focus_group_participant_index ?? null,
  }

  const { error: upsertError } = await admin.from("chat_results").upsert(row, {
    onConflict: "request_id",
  })

  if (upsertError) {
    return NextResponse.json<ApiError>(
      { error: upsertError.message ?? "Failed to persist chat result." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
