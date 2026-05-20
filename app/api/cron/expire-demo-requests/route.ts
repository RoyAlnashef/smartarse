import { NextResponse } from "next/server"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { getDemoRequestTtlDays } from "@/lib/demo-access/config"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

/**
 * Marks pending demo requests older than DEMO_REQUEST_TTL_DAYS as expired.
 *
 * Schedule via Vercel Cron:
 *   GET /api/cron/expire-demo-requests
 *   Header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET?.trim()
  if (!expected) {
    return NextResponse.json<ApiError>(
      { error: "CRON_SECRET is not configured." },
      { status: 503 }
    )
  }

  const auth = request.headers.get("authorization")
  const token = auth?.startsWith("Bearer ")
    ? auth.slice("Bearer ".length).trim()
    : ""
  if (!token || token !== expected) {
    return NextResponse.json<ApiError>({ error: "Unauthorized." }, { status: 401 })
  }

  let admin
  try {
    admin = getSupabaseAdminClient()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Server configuration error."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }

  const ttlDays = getDemoRequestTtlDays()
  const { data, error } = await admin.rpc("expire_pending_demo_access_requests", {
    p_ttl_days: ttlDays,
  })

  if (error) {
    return NextResponse.json<ApiError>(
      { error: error.message ?? "Failed to expire demo requests." },
      { status: 500 }
    )
  }

  return NextResponse.json({ expired: data ?? 0, ttlDays })
}
