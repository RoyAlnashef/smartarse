import { NextResponse } from "next/server"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { authorizeCronRequest } from "@/lib/api/authorize-cron-request"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

/**
 * Pauses all live projects whose `access_until` date has passed (London calendar).
 * Scheduled at 02:00 UTC, which is always after London midnight (GMT/BST).
 *
 * Schedule via your host (e.g. Vercel Cron) to call:
 *   GET /api/cron/pause-expired-projects
 *   Header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const authError = authorizeCronRequest(request)
  if (authError) return authError

  let admin
  try {
    admin = getSupabaseAdminClient()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Server configuration error."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }

  const { error } = await admin.rpc("pause_all_projects_expired_access")
  if (error) {
    return NextResponse.json<ApiError>(
      { error: error.message ?? "Cron job failed." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
