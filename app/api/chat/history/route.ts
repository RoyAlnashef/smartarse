import { NextResponse } from "next/server"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"
import {
  buildHistoryResponse,
  HISTORY_FETCH_CAP,
  type ChatHistorySourceRow,
} from "@/lib/api/chat-history-server"

export async function GET(request: Request) {
  const session = await requireChatSession(request)
  if (session instanceof NextResponse) {
    return session
  }

  const { supabase, profile } = session
  const { searchParams } = new URL(request.url)
  const pageParam = searchParams.get("page")
  const projectId = searchParams.get("project_id")

  const pageRaw = pageParam ? Number(pageParam) : 1

  if (projectId !== null && projectId !== "") {
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRe.test(projectId)) {
      return NextResponse.json<ApiError>(
        { error: "Invalid project_id." },
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
  }

  let query = supabase
    .from("chat_results")
    .select("request_id, user_query, created_at, status, result_payload")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(HISTORY_FETCH_CAP)

  if (projectId !== null && projectId !== "") {
    query = query.eq("project_id", projectId)
  }

  const { data: rows, error: fetchError } = await query

  if (fetchError) {
    return NextResponse.json<ApiError>(
      { error: fetchError.message ?? "Failed to load history." },
      { status: 500 }
    )
  }

  const body = buildHistoryResponse(
    (rows ?? []) as ChatHistorySourceRow[],
    pageRaw
  )

  return NextResponse.json(body)
}
