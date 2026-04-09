import { createHash, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import {
  attachMergeMeta,
  extractMergeMeta,
  mergeCompletedJobIntoAnchor,
} from "@/lib/api/chat-anchor-merge"
import { PROJECT_NOT_LIVE_CHAT_MESSAGE } from "@/lib/project-status"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

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
})

function pickDenormFromResult(
  result: Record<string, unknown> | undefined,
  key: "weighted" | "data_source_mode"
): unknown {
  if (!result) return undefined
  return result[key]
}

function secretsMatch(provided: string, expected: string): boolean {
  if (!provided || !expected) return false
  const a = createHash("sha256").update(provided, "utf8").digest()
  const b = createHash("sha256").update(expected, "utf8").digest()
  return timingSafeEqual(a, b)
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

  if (!secretsMatch(token, expectedSecret)) {
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
      return NextResponse.json<ApiError>(
        { error: PROJECT_NOT_LIVE_CHAT_MESSAGE },
        { status: 403 }
      )
    }
  }

  const { data: existing } = await admin
    .from("chat_results")
    .select("request_id, user_id, project_id, organization_id, result_payload")
    .eq("request_id", body.request_id)
    .maybeSingle()

  if (existing?.user_id != null && existing.user_id !== body.user_id) {
    return NextResponse.json<ApiError>(
      { error: "Forbidden." },
      { status: 403 }
    )
  }

  const resultObj = body.result ?? {}
  const mergeMeta = extractMergeMeta(existing?.result_payload)
  const existingProjectId =
    typeof existing?.project_id === "string" ? existing.project_id : null
  const mergeProjectId = body.project_id ?? existingProjectId

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
      userTimestamp: mergeMeta.merge_user_timestamp,
      assistantTimestamp: mergeMeta.merge_assistant_timestamp,
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
        : null

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
      { error: upsertError.message ?? "Failed to upsert chat result." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
