import { NextResponse } from "next/server"
import {
  requireDashboardAdmin,
  type ApiError,
} from "@/lib/api/require-dashboard-admin"
import { evaluateProjectCreditAlert } from "@/lib/support-notifications/process"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireDashboardAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { id } = await context.params
  if (!id?.trim()) {
    return NextResponse.json<ApiError>({ error: "Invalid project id." }, { status: 400 })
  }

  try {
    await evaluateProjectCreditAlert(authResult.adminClient, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to evaluate credit alert."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }
}
