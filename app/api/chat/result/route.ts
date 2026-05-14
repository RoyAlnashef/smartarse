import { NextResponse } from "next/server"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(request: Request) {
  const session = await requireChatSession(request)
  if (session instanceof NextResponse) {
    return session
  }

  const { supabase, profile } = session
  const { searchParams } = new URL(request.url)
  const requestId = searchParams.get("request_id")
  const projectId = searchParams.get("project_id")

  if (!requestId || !uuidRe.test(requestId)) {
    return NextResponse.json<ApiError>(
      { error: "Invalid or missing request_id." },
      { status: 400 }
    )
  }

  if (!projectId || !uuidRe.test(projectId)) {
    return NextResponse.json<ApiError>(
      { error: "Invalid or missing project_id." },
      { status: 400 }
    )
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle()

  if (projectError || !project) {
    return NextResponse.json<ApiError>(
      { error: "Project not found." },
      { status: 404 }
    )
  }

  const { data: row, error } = await supabase
    .from("chat_results")
    .select(
      "request_id, user_query, created_at, status, result_payload, project_id, persona_segment_id, persona_segment_name, persona_segment_color_token, custom_audience_id, custom_audience_name, custom_audience_child_segment_ids, custom_audience_child_segment_names, custom_audience_child_segment_color_tokens, chat_context_mode"
    )
    .eq("request_id", requestId)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json<ApiError>(
      { error: error.message ?? "Failed to load chat result." },
      { status: 500 }
    )
  }

  if (!row || row.project_id !== projectId) {
    return NextResponse.json<ApiError>(
      { error: "Chat result not found." },
      { status: 404 }
    )
  }

  return NextResponse.json({
    request_id: row.request_id,
    user_query: row.user_query,
    created_at: row.created_at,
    status: row.status,
    result_payload: row.result_payload,
    persona_segment_id: row.persona_segment_id ?? null,
    persona_segment_name: row.persona_segment_name ?? null,
    persona_segment_color_token: row.persona_segment_color_token ?? null,
    custom_audience_id: row.custom_audience_id ?? null,
    custom_audience_name: row.custom_audience_name ?? null,
    custom_audience_child_segment_ids:
      row.custom_audience_child_segment_ids ?? null,
    custom_audience_child_segment_names:
      row.custom_audience_child_segment_names ?? null,
    custom_audience_child_segment_color_tokens:
      row.custom_audience_child_segment_color_tokens ?? null,
    chat_context_mode: row.chat_context_mode ?? null,
  })
}
