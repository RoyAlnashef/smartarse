import { NextResponse } from "next/server"
import {
  requireDashboardAdmin,
  type ApiError,
} from "@/lib/api/require-dashboard-admin"
import {
  buildAdminHistoryResponse,
  HISTORY_FETCH_CAP,
  type AdminChatHistorySourceRow,
} from "@/lib/api/admin-chat-history-server"

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

  let query = adminClient
    .from("chat_results")
    .select("request_id, user_id, user_query, created_at, status, result_payload")
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

  const userIds = [...new Set((rows ?? []).map((row) => row.user_id).filter(Boolean))]
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

  const body = buildAdminHistoryResponse({
    rows: (rows ?? []) as AdminChatHistorySourceRow[],
    pageRaw,
    userLabelById,
  })
  return NextResponse.json(body)
}
