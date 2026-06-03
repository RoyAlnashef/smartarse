import { NextResponse } from "next/server"
import { authorizeCronRequest } from "@/lib/api/authorize-cron-request"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { processPendingSupportNotifications } from "@/lib/support-notifications/process"

/**
 * Drains pending low-credit support notification rows queued by the DB trigger.
 *
 * Schedule via Vercel Cron:
 *   GET /api/cron/support-notifications-outbox
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

  try {
    const result = await processPendingSupportNotifications(admin)
    return NextResponse.json({ ok: true, ...result }, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Support notification outbox failed."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }
}
