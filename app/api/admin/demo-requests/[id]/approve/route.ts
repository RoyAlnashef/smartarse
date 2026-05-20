import { NextResponse } from "next/server"
import {
  approveDemoAccessRequest,
  approveResultMessage,
} from "@/lib/demo-access/provision"
import {
  requireDashboardAdmin,
  type ApiError,
} from "@/lib/api/require-dashboard-admin"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireDashboardAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { adminClient } = authResult
  const { id } = await context.params

  const result = await approveDemoAccessRequest(adminClient, id)
  const { title, message, isError } = approveResultMessage(result)

  if (!result.ok || isError) {
    return NextResponse.json<ApiError>(
      { error: !result.ok ? result.reason : message },
      { status: 400 }
    )
  }

  return NextResponse.json({ title, message, kind: result.kind })
}
