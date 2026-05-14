import { NextResponse } from "next/server"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

/**
 * Pauses all live projects whose `access_until` date has passed (UTC calendar).
 *
 * Schedule via your host (e.g. Vercel Cron) to call:
 *   GET /api/cron/pause-expired-projects
 *   Header: Authorization: Bearer <CRON_SECRET>
 *
 * Set `CRON_SECRET` in the server environment to enable this route.
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
  const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : ""
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

  const { error } = await admin.rpc("pause_all_projects_expired_access")
  if (error) {
    return NextResponse.json<ApiError>(
      { error: error.message ?? "Cron job failed." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
