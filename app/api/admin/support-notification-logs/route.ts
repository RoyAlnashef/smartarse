import { NextResponse } from "next/server"
import {
  requireDashboardAdmin,
  type ApiError,
} from "@/lib/api/require-dashboard-admin"
import type {
  SupportNotificationLogEntry,
  SupportNotificationLogRow,
} from "@/lib/support-notifications/types"

const LOG_LIMIT = 200

type LogRowWithProject = SupportNotificationLogRow & {
  projects: {
    name: string
    organizations: { name: string } | null
  } | null
}

export async function GET(request: Request) {
  const authResult = await requireDashboardAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { data, error } = await authResult.adminClient
      .from("support_notification_log")
      .select("*, projects(name, organizations(name))")
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(LOG_LIMIT)

    if (error) {
      throw new Error(error.message)
    }

    const logs: SupportNotificationLogEntry[] = ((data ?? []) as LogRowWithProject[]).map(
      (row) => ({
        id: row.id,
        notification_type: row.notification_type,
        project_id: row.project_id,
        event_key: row.event_key,
        status: row.status,
        sent_at: row.sent_at,
        created_at: row.created_at,
        project_name: row.projects?.name ?? "Unknown project",
        organization_name: row.projects?.organizations?.name ?? "Unknown organisation",
      }),
    )

    return NextResponse.json({ logs, truncated: logs.length === LOG_LIMIT })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load support notification logs."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }
}
