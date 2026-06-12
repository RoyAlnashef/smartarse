import { NextResponse } from "next/server"
import { z } from "zod"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { secretsMatch } from "@/lib/api/compare-secrets"
import {
  attachMergeMeta,
  extractMergeMeta,
  mergeCompletedJobIntoAnchor,
} from "@/lib/api/chat-anchor-merge"
import {
  ensureActivationPrefixInResultRecord,
  type ChatContextModeForThread,
  type ContextActivationDenorm,
} from "@/lib/chat-thread"
import { projectNotLiveChatMessage } from "@/lib/project-status"
import { getClientSupportContactEmail } from "@/lib/support-contact-server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { segmentColorTokenForDatabase } from "@/lib/theme/cite-color-tokens"

const bodySchema = z.object({
  request_id: z.string().uuid(),
  user_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  project_id: z.string().uuid().nullable().optional(),
  user_query: z.string().trim().min(1).max(50_000),
  status: z.enum(["pending", "processing", "complete", "error_fallback"]),
  result: z.record(z.string(), z.unknown()).optional(),
  weighted: z.boolean().nullable().optional(),
  data_source_mode: z.string().max(120).nullable().optional(),
  system_version: z.string().max(64).nullable().optional(),
  is_cacheable: z.boolean().optional(),
  cache_hit_count: z.number().int().min(0).optional(),
  persona_segment_id: z.string().max(120).nullable().optional(),
  persona_segment_name: z.string().max(300).nullable().optional(),
  persona_segment_color_token: z.string().max(64).nullable().optional(),
  chat_context_mode: z
    .enum(["default", "persona_segment", "custom_audience"])
    .optional(),
  custom_audience_id: z.string().uuid().nullable().optional(),
  custom_audience_name: z.string().max(300).nullable().optional(),
  custom_audience_child_segment_ids: z.array(z.string().max(120)).nullable().optional(),
  custom_audience_child_segment_names: z.array(z.string().max(300)).nullable().optional(),
  custom_audience_child_segment_color_tokens: z
    .array(z.string().max(64).nullable())
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

const CHAT_CONTEXT_MODES = new Set<string>([
  "default",
  "persona_segment",
  "custom_audience",
])

function coerceChatContextMode(
  value: string | null | undefined
): ChatContextModeForThread {
  if (value && CHAT_CONTEXT_MODES.has(value)) {
    return value as ChatContextModeForThread
  }
  return "default"
}

/** Row shape for `chat_results` reads in this route (admin client is loosely typed). */
type N8nChatResultExistingRow = {
  user_id?: string
  status?: string
  result_payload?: unknown
  project_id?: string | null
  chat_context_mode?: ChatContextModeForThread
  persona_segment_id?: string | null
  persona_segment_name?: string | null
  persona_segment_color_token?: string | null
  custom_audience_id?: string | null
  custom_audience_name?: string | null
  custom_audience_child_segment_ids?: string[] | null
  custom_audience_child_segment_names?: string[] | null
  custom_audience_child_segment_color_tokens?: (string | null)[] | null
  show_in_chat_history?: boolean
}

function callbackSecretsMatch(provided: string, expected: string): boolean {
  return secretsMatch(provided, expected)
}

function callbackSecret(): string {
  return (
    process.env.CHAT_N8N_CALLBACK_SECRET?.trim() ||
    process.env.N8N_CHAT_CALLBACK_SECRET?.trim() ||
    ""
  )
}

export async function POST(request: Request) {
  const expectedSecret = callbackSecret()
  if (!expectedSecret) {
    return NextResponse.json<ApiError>(
      { error: "Chat n8n callback is not configured (CHAT_N8N_CALLBACK_SECRET)." },
      { status: 503 }
    )
  }

  const auth = request.headers.get("authorization")
  const bearer =
    auth?.startsWith("Bearer ") ? auth.slice(7).trim() : ""
  const headerSecret =
    request.headers.get("x-chat-n8n-secret")?.trim() ?? ""
  const token = bearer || headerSecret

  if (!callbackSecretsMatch(token, expectedSecret)) {
    return NextResponse.json<ApiError>({ error: "Unauthorized." }, { status: 401 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid JSON body." },
      { status: 400 }
    )
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json<ApiError>(
      { error: first?.message ?? "Invalid request body." },
      { status: 400 }
    )
  }

  const body = parsed.data

  let admin
  try {
    admin = getSupabaseAdminClient()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Server configuration error."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }

  const { data: userRow, error: userError } = await admin
    .from("users")
    .select("id, organization_id")
    .eq("id", body.user_id)
    .maybeSingle()

  if (userError || !userRow || userRow.organization_id !== body.organization_id) {
    return NextResponse.json<ApiError>(
      { error: "User not found or organization mismatch." },
      { status: 403 }
    )
  }

  if (body.project_id) {
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

    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("id, organization_id, status")
      .eq("id", body.project_id)
      .maybeSingle()

    if (projectError || !project || project.organization_id !== body.organization_id) {
      return NextResponse.json<ApiError>(
        { error: "Project not found or organization mismatch." },
        { status: 404 }
      )
    }

    if ((project as { status: string }).status !== "live") {
      const supportEmail = await getClientSupportContactEmail()
      return NextResponse.json<ApiError>(
        { error: projectNotLiveChatMessage(supportEmail) },
        { status: 403 }
      )
    }
  }

  const { data: existingRaw } = await admin
    .from("chat_results")
    .select(
      "request_id, user_id, project_id, organization_id, result_payload, status, persona_segment_id, persona_segment_name, persona_segment_color_token"
      + ", custom_audience_id, custom_audience_name, custom_audience_child_segment_ids, custom_audience_child_segment_names, custom_audience_child_segment_color_tokens, chat_context_mode, show_in_chat_history"
    )
    .eq("request_id", body.request_id)
    .maybeSingle()

  const existing = existingRaw as N8nChatResultExistingRow | null

  if (existing?.user_id != null && existing.user_id !== body.user_id) {
    return NextResponse.json<ApiError>(
      { error: "Forbidden." },
      { status: 403 }
    )
  }

  let resultObj: Record<string, unknown> = { ...(body.result ?? {}) }
  if (
    existing?.status === "cancelled" &&
    (body.status === "complete" || body.status === "error_fallback")
  ) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }
  const mergeMeta = extractMergeMeta(existing?.result_payload)
  const existingProjectId =
    typeof existing?.project_id === "string" ? existing.project_id : null
  const mergeProjectId = body.project_id ?? existingProjectId

  const resolvedChatContextMode = coerceChatContextMode(
    body.chat_context_mode ?? existing?.chat_context_mode
  )

  if (
    mergeMeta.thread_anchor_request_id &&
    mergeProjectId &&
    (body.status === "complete" || body.status === "error_fallback")
  ) {
    const merged = await mergeCompletedJobIntoAnchor({
      admin,
      actorUserId: body.user_id,
      organizationId: body.organization_id,
      projectId: mergeProjectId,
      anchorRequestId: mergeMeta.thread_anchor_request_id,
      jobRequestId: body.request_id,
      followUpUserQuestion: body.user_query,
      newResult: resultObj,
      status: body.status,
      systemVersion: body.system_version ?? null,
      personaSegmentId: body.persona_segment_id ?? existing?.persona_segment_id ?? null,
      personaSegmentName: body.persona_segment_name ?? existing?.persona_segment_name ?? null,
      personaSegmentColorToken:
        body.persona_segment_color_token ?? existing?.persona_segment_color_token ?? null,
      customAudienceId: body.custom_audience_id ?? existing?.custom_audience_id ?? null,
      customAudienceName:
        body.custom_audience_name ?? existing?.custom_audience_name ?? null,
      customAudienceChildSegmentIds:
        body.custom_audience_child_segment_ids ??
        existing?.custom_audience_child_segment_ids ??
        null,
      customAudienceChildSegmentNames:
        body.custom_audience_child_segment_names ??
        existing?.custom_audience_child_segment_names ??
        null,
      customAudienceChildSegmentColorTokens:
        body.custom_audience_child_segment_color_tokens ??
        existing?.custom_audience_child_segment_color_tokens ??
        null,
      chatContextMode: resolvedChatContextMode,
      userTimestamp: mergeMeta.merge_user_timestamp,
      assistantTimestamp: mergeMeta.merge_assistant_timestamp,
      showInChatHistory:
        typeof existing?.show_in_chat_history === "boolean"
          ? existing.show_in_chat_history
          : true,
    })
    if (!merged.ok) {
      return NextResponse.json<ApiError>(
        { error: merged.error },
        { status: merged.status }
      )
    }
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  if (
    !mergeMeta.thread_anchor_request_id &&
    (body.status === "complete" || body.status === "error_fallback") &&
    resolvedChatContextMode !== "default"
  ) {
    const denorm: ContextActivationDenorm = {
      chatContextMode: resolvedChatContextMode,
      personaSegmentId: body.persona_segment_id ?? existing?.persona_segment_id ?? null,
      customAudienceId: body.custom_audience_id ?? existing?.custom_audience_id ?? null,
      customAudienceName: body.custom_audience_name ?? existing?.custom_audience_name ?? null,
      customAudienceChildSegmentNames:
        body.custom_audience_child_segment_names ??
        existing?.custom_audience_child_segment_names ??
        null,
      requestIdForActivationId: body.request_id,
    }
    resultObj = ensureActivationPrefixInResultRecord(resultObj, {
      user_query: body.user_query,
      firstUserTimestamp:
        mergeMeta.merge_user_timestamp?.trim() || new Date().toISOString(),
      denorm,
    })
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
    organization_id: body.organization_id,
    project_id: mergeProjectId ?? null,
    user_id: body.user_id,
    user_query: body.user_query,
    status: body.status,
    result_payload: attachMergeMeta({
      result: resultObj,
      threadAnchorRequestId: mergeMeta.thread_anchor_request_id,
      mergeUserTimestamp: mergeMeta.merge_user_timestamp,
      mergeAssistantTimestamp: mergeMeta.merge_assistant_timestamp,
    }),
    weighted,
    data_source_mode: dataSourceMode ?? FALLBACK_DATA_SOURCE_MODE,
    system_version: body.system_version ?? null,
    is_cacheable: body.is_cacheable ?? false,
    cache_hit_count: body.cache_hit_count ?? 0,
    persona_segment_id: body.persona_segment_id ?? existing?.persona_segment_id ?? null,
    persona_segment_name: body.persona_segment_name ?? existing?.persona_segment_name ?? null,
    persona_segment_color_token: segmentColorTokenForDatabase(
      body.persona_segment_color_token ?? existing?.persona_segment_color_token ?? null
    ),
    custom_audience_id: body.custom_audience_id ?? existing?.custom_audience_id ?? null,
    custom_audience_name:
      body.custom_audience_name ?? existing?.custom_audience_name ?? null,
    custom_audience_child_segment_ids:
      body.custom_audience_child_segment_ids ??
      existing?.custom_audience_child_segment_ids ??
      null,
    custom_audience_child_segment_names:
      body.custom_audience_child_segment_names ??
      existing?.custom_audience_child_segment_names ??
      null,
    custom_audience_child_segment_color_tokens: (() => {
      const raw =
        body.custom_audience_child_segment_color_tokens ??
        existing?.custom_audience_child_segment_color_tokens ??
        null
      return raw?.map((t: string | null) => segmentColorTokenForDatabase(t)) ?? null
    })(),
    chat_context_mode: resolvedChatContextMode,
    show_in_chat_history:
      typeof existing?.show_in_chat_history === "boolean"
        ? existing.show_in_chat_history
        : true,
  }

  const { error: upsertError } = await admin.from("chat_results").upsert(row, {
    onConflict: "request_id",
  })

  if (upsertError) {
    return NextResponse.json<ApiError>(
      { error: upsertError.message ?? "Failed to upsert chat result." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
