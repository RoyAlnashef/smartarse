import { NextResponse } from "next/server"
import { z } from "zod"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const cancelBodySchema = z.object({
  request_id: z.string().uuid(),
  project_id: z.string().uuid(),
  user_query: z.string().trim().min(1).max(50_000),
})

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid JSON body." },
      { status: 400 }
    )
  }

  const parsed = cancelBodySchema.safeParse(json)
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

  const { data: existing } = await admin
    .from("chat_results")
    .select("user_id, status")
    .eq("request_id", body.request_id)
    .maybeSingle()

  if (existing?.user_id != null && existing.user_id !== profile.id) {
    return NextResponse.json<ApiError>(
      { error: "Forbidden." },
      { status: 403 }
    )
  }
  if (
    existing?.status === "complete" ||
    existing?.status === "error_fallback"
  ) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const row = {
    request_id: body.request_id,
    organization_id: project.organization_id,
    project_id: body.project_id,
    user_id: profile.id,
    user_query: body.user_query,
    status: "cancelled",
    result_payload: {},
  }

  const { error: upsertError } = await admin.from("chat_results").upsert(row, {
    onConflict: "request_id",
  })

  if (upsertError) {
    return NextResponse.json<ApiError>(
      { error: upsertError.message ?? "Failed to cancel chat request." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
