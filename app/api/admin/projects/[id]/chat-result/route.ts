import { NextResponse } from "next/server"
import {
  requireDashboardAdmin,
  type ApiError,
} from "@/lib/api/require-dashboard-admin"

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
  const requestId = searchParams.get("request_id")

  if (!uuidRe.test(projectId)) {
    return NextResponse.json<ApiError>({ error: "Invalid project id." }, { status: 400 })
  }
  if (!requestId || !uuidRe.test(requestId)) {
    return NextResponse.json<ApiError>(
      { error: "Invalid or missing request_id." },
      { status: 400 }
    )
  }

  const { data: project, error: projectError } = await adminClient
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle()
  if (projectError || !project) {
    return NextResponse.json<ApiError>({ error: "Project not found." }, { status: 404 })
  }

  const { data: row, error: rowError } = await adminClient
    .from("chat_results")
    .select("request_id, user_id, user_query, created_at, status, result_payload, project_id")
    .eq("request_id", requestId)
    .eq("project_id", projectId)
    .maybeSingle()

  if (rowError) {
    return NextResponse.json<ApiError>(
      { error: rowError.message ?? "Failed to load chat result." },
      { status: 500 }
    )
  }
  if (!row) {
    return NextResponse.json<ApiError>({ error: "Chat result not found." }, { status: 404 })
  }

  const { data: user } = await adminClient
    .from("users")
    .select("name, email")
    .eq("id", row.user_id)
    .maybeSingle()

  const userLabel = user?.name?.trim() || user?.email?.trim() || "Unknown user"

  return NextResponse.json({
    request_id: row.request_id,
    user_id: row.user_id,
    user_label: userLabel,
    user_query: row.user_query,
    created_at: row.created_at,
    status: row.status,
    result_payload: row.result_payload,
  })
}
