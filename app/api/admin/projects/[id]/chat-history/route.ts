import { NextResponse } from "next/server"
import {
  requireDashboardAdmin,
  type ApiError,
} from "@/lib/api/require-dashboard-admin"
import {
  buildAdminHistoryResponse,
  HISTORY_FETCH_CAP,
  type AdminChatHistorySourceRow,
  type AdminFocusGroupSessionSnapshot,
} from "@/lib/api/admin-chat-history-server"

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireDashboardAdmin(request)
  if (authResult instanceof NextResponse) return authResult
  const { adminClient } = authResult
  const { id: projectId } = await context.params
  const { searchParams } = new URL(request.url)

  if (!uuidRe.test(projectId)) {
    return NextResponse.json<ApiError>({ error: "Invalid project id." }, { status: 400 })
  }

  const pageParam = searchParams.get("page")
  const pageRaw = pageParam ? Number(pageParam) : 1
  const selectedUserId = searchParams.get("user_id")
  if (selectedUserId && !uuidRe.test(selectedUserId)) {
    return NextResponse.json<ApiError>({ error: "Invalid user_id." }, { status: 400 })
  }

  const { data: project, error: projectError } = await adminClient
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle()
  if (projectError || !project) {
    return NextResponse.json<ApiError>({ error: "Project not found." }, { status: 404 })
  }

  // Admin history lists all chat_results (including draft custom-audience explore) for support.

  let query = adminClient
    .from("chat_results")
    .select(
      "request_id, user_id, user_query, created_at, status, result_payload, chat_context_mode, persona_segment_id, persona_segment_name, persona_segment_color_token, custom_audience_id, custom_audience_name, custom_audience_child_segment_ids, custom_audience_child_segment_names, custom_audience_child_segment_color_tokens, focus_group_session_id, focus_group_round_number, focus_group_participant_index"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_FETCH_CAP)

  if (selectedUserId) query = query.eq("user_id", selectedUserId)
  const { data: rows, error: rowsError } = await query
  if (rowsError) {
    return NextResponse.json<ApiError>(
      { error: rowsError.message ?? "Failed to load history." },
      { status: 500 }
    )
  }

  const typedRows = (rows ?? []) as AdminChatHistorySourceRow[]

  const userIds = [...new Set(typedRows.map((row) => row.user_id).filter(Boolean))]
  const userLabelById = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: users, error: usersError } = await adminClient
      .from("users")
      .select("id, name, email")
      .in("id", userIds)
    if (usersError) {
      return NextResponse.json<ApiError>(
        { error: usersError.message ?? "Failed to load history users." },
        { status: 500 }
      )
    }
    for (const row of users ?? []) {
      const label = row.name?.trim() || row.email?.trim() || "Unknown user"
      userLabelById.set(row.id, label)
    }
  }

  // Hydrate focus-group entries with participant color tokens so the sidebar
  // can render the same dot-stack treatment as the client-facing chat history.
  const focusGroupSessionIds = Array.from(
    new Set(
      typedRows
        .map((r) => r.focus_group_session_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  )

  const focusGroupSessions = new Map<string, AdminFocusGroupSessionSnapshot>()
  if (focusGroupSessionIds.length > 0) {
    const { data: sessionRows } = await adminClient
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

  const body = buildAdminHistoryResponse({
    rows: typedRows,
    pageRaw,
    userLabelById,
    focusGroupSessions,
  })
  return NextResponse.json(body)
}
