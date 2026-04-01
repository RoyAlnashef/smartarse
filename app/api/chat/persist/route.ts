import { NextResponse } from "next/server"
import { z } from "zod"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"
import { mergeJobIntoAnchorPayload } from "@/lib/chat-thread"
import { PROJECT_NOT_LIVE_CHAT_MESSAGE } from "@/lib/project-status"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

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
  /** When set, merge this job into the anchor row and remove the ephemeral `request_id` row. */
  thread_anchor_request_id: z.string().uuid().optional(),
  merge_user_timestamp: z.string().optional(),
  merge_assistant_timestamp: z.string().optional(),
})

function pickDenormFromResult(
  result: Record<string, unknown> | undefined,
  key: "weighted" | "data_source_mode"
): unknown {
  if (!result) return undefined
  return result[key]
}

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

  let admin
  try {
    admin = getSupabaseAdminClient()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Server configuration error."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }

  const { data: existing } = await admin
    .from("chat_results")
    .select("user_id")
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

  const resultObj = body.result ?? {}
  const status = body.status ?? "complete"

  const anchorId = body.thread_anchor_request_id
  if (anchorId) {
    if (anchorId === body.request_id) {
      return NextResponse.json<ApiError>(
        { error: "thread_anchor_request_id must differ from request_id." },
        { status: 400 }
      )
    }

    const { data: anchor, error: anchorError } = await admin
      .from("chat_results")
      .select(
        "user_id, project_id, organization_id, user_query, created_at, result_payload"
      )
      .eq("request_id", anchorId)
      .maybeSingle()

    if (anchorError || !anchor) {
      return NextResponse.json<ApiError>(
        { error: "Thread anchor not found." },
        { status: 404 }
      )
    }

    if (
      anchor.user_id !== profile.id ||
      anchor.project_id !== body.project_id ||
      anchor.organization_id !== project.organization_id
    ) {
      return NextResponse.json<ApiError>(
        { error: "Forbidden." },
        { status: 403 }
      )
    }

    const anchorPayload =
      anchor.result_payload !== null &&
      typeof anchor.result_payload === "object" &&
      !Array.isArray(anchor.result_payload)
        ? (anchor.result_payload as Record<string, unknown>)
        : {}

    const nowIso = new Date().toISOString()
    const userTs = body.merge_user_timestamp?.trim() || nowIso
    const asstTs = body.merge_assistant_timestamp?.trim() || nowIso

    const mergedPayload = mergeJobIntoAnchorPayload({
      anchorRequestId: anchorId,
      anchorPayload,
      anchorUserQuery: anchor.user_query as string,
      anchorCreatedAt: anchor.created_at as string,
      jobRequestId: body.request_id,
      followUpUserQuestion: body.user_query,
      newResult: resultObj,
      userTimestamp: userTs,
      assistantTimestamp: asstTs,
    })

    const weightedMerge =
      body.weighted !== undefined
        ? body.weighted
        : typeof pickDenormFromResult(mergedPayload, "weighted") === "boolean"
          ? (pickDenormFromResult(mergedPayload, "weighted") as boolean)
          : null

    const dataSourceMerge =
      body.data_source_mode !== undefined
        ? body.data_source_mode
        : typeof pickDenormFromResult(mergedPayload, "data_source_mode") ===
            "string"
          ? (pickDenormFromResult(mergedPayload, "data_source_mode") as string)
          : null

    const { error: updateAnchorError } = await admin
      .from("chat_results")
      .update({
        status,
        result_payload: mergedPayload,
        weighted: weightedMerge,
        data_source_mode: dataSourceMerge,
        system_version: body.system_version ?? null,
      })
      .eq("request_id", anchorId)

    if (updateAnchorError) {
      return NextResponse.json<ApiError>(
        {
          error:
            updateAnchorError.message ?? "Failed to update thread anchor row.",
        },
        { status: 500 }
      )
    }

    const { error: deleteJobError } = await admin
      .from("chat_results")
      .delete()
      .eq("request_id", body.request_id)
      .eq("user_id", profile.id)

    if (deleteJobError) {
      return NextResponse.json<ApiError>(
        { error: deleteJobError.message ?? "Failed to remove job row." },
        { status: 500 }
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
        : null

  const row = {
    request_id: body.request_id,
    organization_id: project.organization_id,
    project_id: body.project_id,
    user_id: profile.id,
    user_query: body.user_query,
    status,
    result_payload: resultObj,
    weighted,
    data_source_mode: dataSourceMode,
    system_version: body.system_version ?? null,
    is_cacheable: body.is_cacheable ?? false,
    cache_hit_count: body.cache_hit_count ?? 0,
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
