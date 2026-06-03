import { NextResponse } from "next/server"
import {
  requireDashboardAdmin,
  type ApiError,
} from "@/lib/api/require-dashboard-admin"
import {
  loadPlatformSettings,
  savePlatformSettings,
} from "@/lib/support-notifications/platform-settings"
import type { PlatformSettings } from "@/lib/support-notifications/types"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parsePlatformSettingsBody(body: unknown): PlatformSettings | null {
  if (!body || typeof body !== "object") return null
  const record = body as Record<string, unknown>

  if (typeof record.supportEmail !== "string") return null
  const supportEmail = record.supportEmail.trim()
  if (!EMAIL_PATTERN.test(supportEmail)) return null

  if (typeof record.notifyCreditBalanceLow !== "boolean") return null
  if (typeof record.notifyAccessExpires4Weeks !== "boolean") return null
  if (typeof record.notifyAccessExpires2Weeks !== "boolean") return null

  return {
    supportEmail,
    notifyCreditBalanceLow: record.notifyCreditBalanceLow,
    notifyAccessExpires4Weeks: record.notifyAccessExpires4Weeks,
    notifyAccessExpires2Weeks: record.notifyAccessExpires2Weeks,
  }
}

export async function GET(request: Request) {
  const authResult = await requireDashboardAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const settings = await loadPlatformSettings(authResult.adminClient)
    return NextResponse.json({ settings })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load platform settings."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireDashboardAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiError>({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = parsePlatformSettingsBody(body)
  if (!parsed) {
    return NextResponse.json<ApiError>(
      { error: "Invalid platform settings payload." },
      { status: 400 },
    )
  }

  try {
    const settings = await savePlatformSettings(authResult.adminClient, parsed)
    return NextResponse.json({ settings })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save platform settings."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }
}
