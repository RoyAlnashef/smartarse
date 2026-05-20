import { NextResponse } from "next/server"
import { listDemoAccessRequests } from "@/lib/demo-access/list"
import type { DemoAccessRequestStatus } from "@/lib/demo-access/types"
import {
  requireDashboardAdmin,
  type ApiError,
} from "@/lib/api/require-dashboard-admin"

const VALID_STATUSES = new Set([
  "all",
  "pending",
  "approved",
  "rejected",
  "magic_link_sent",
  "expired",
])

export async function GET(request: Request) {
  const authResult = await requireDashboardAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { adminClient } = authResult

  const url = new URL(request.url)
  const statusParam = url.searchParams.get("status") ?? "all"
  const status = VALID_STATUSES.has(statusParam)
    ? (statusParam as DemoAccessRequestStatus | "all")
    : "all"
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10)
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10)

  try {
    const { items, total } = await listDemoAccessRequests(adminClient, {
      status,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 50,
    })
    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load demo requests."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }
}
