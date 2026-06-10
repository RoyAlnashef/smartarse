import { NextResponse } from "next/server"
import { z } from "zod"
import {
  approveDemoAccessRequest,
  approveResultMessage,
} from "@/lib/demo-access/provision"
import {
  requireDashboardAdmin,
  type ApiError,
} from "@/lib/api/require-dashboard-admin"

const uuidSchema = z.string().uuid()

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

  const idResult = uuidSchema.safeParse(id)
  if (!idResult.success) {
    return NextResponse.json<ApiError>(
      { error: "Invalid demo request id." },
      { status: 400 }
    )
  }

  const result = await approveDemoAccessRequest(adminClient, idResult.data)
  const { title, message, isError } = approveResultMessage(result)

  if (!result.ok || isError) {
    return NextResponse.json<ApiError>(
      { error: !result.ok ? result.reason : message },
      { status: 400 }
    )
  }

  return NextResponse.json({ title, message, kind: result.kind })
}
