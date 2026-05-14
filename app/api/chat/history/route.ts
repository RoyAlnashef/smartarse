import { NextResponse } from "next/server"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"
import {
  buildHistoryResponse,
  HISTORY_FETCH_CAP,
  type ChatHistorySourceRow,
  type FocusGroupSessionSnapshot,
} from "@/lib/api/chat-history-server"

/**
 * Pulls participant color tokens out of `focus_group_sessions.participants`
 * JSON. The persisted shape mirrors POST /api/focus-group/sessions:
 *   `{ persona_id, segment_code, title, color_token, country? }`
 */
function extractParticipantColorTokens(raw: unknown): string[] {
  let value: unknown = raw
  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return []
    }
  }
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      const token = (entry as Record<string, unknown>).color_token
      return typeof token === "string" && token.trim() ? token : null
    })
    .filter((t): t is string => t != null)
}

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
    .select(
      "request_id, user_query, created_at, status, result_payload, chat_context_mode, persona_segment_id, persona_segment_name, persona_segment_color_token, custom_audience_id, custom_audience_name, custom_audience_child_segment_ids, custom_audience_child_segment_names, custom_audience_child_segment_color_tokens, focus_group_session_id, focus_group_round_number, focus_group_participant_index, show_in_chat_history"
    )
    .eq("user_id", profile.id)
    .eq("show_in_chat_history", true)
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

  const typedRows = (rows ?? []) as ChatHistorySourceRow[]

  // Hydrate focus-group entries with participant color tokens so the sidebar
  // can render the same dot-stack treatment as custom-audience entries.
  const focusGroupSessionIds = Array.from(
    new Set(
      typedRows
        .map((r) => r.focus_group_session_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  )

  const focusGroupSessions = new Map<string, FocusGroupSessionSnapshot>()
  if (focusGroupSessionIds.length > 0) {
    const { data: sessionRows } = await supabase
      .from("focus_group_sessions")
      .select("id, participants")
      .in("id", focusGroupSessionIds)
    for (const row of (sessionRows ?? []) as Array<{
      id: string
      participants: unknown
    }>) {
      focusGroupSessions.set(row.id, {
        participantColorTokens: extractParticipantColorTokens(row.participants),
      })
    }
  }

  const body = buildHistoryResponse(typedRows, pageRaw, focusGroupSessions)

  return NextResponse.json(body)
}
