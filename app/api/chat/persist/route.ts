import { NextResponse } from "next/server"
import { z } from "zod"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"
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
    .select("id, organization_id")
    .eq("id", body.project_id)
    .maybeSingle()

  if (projectError || !project) {
    return NextResponse.json<ApiError>(
      { error: "Project not found." },
      { status: 404 }
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
