import type { SupabaseClient } from "@supabase/supabase-js"
import { utcCalendarDaysUntil } from "@/lib/project-status"
import {
  eventKeyForExpiryDays,
  notificationTypeForExpiryDays,
  shouldClearCreditLowLog,
  shouldQueueCreditLowAlert,
  shouldSendExpiryReminder,
} from "@/lib/support-notifications/evaluate"
import { sendSupportNotificationEmail } from "@/lib/support-notifications/send"
import type {
  SupportNotificationLogRow,
  SupportNotificationProjectContext,
} from "@/lib/support-notifications/types"

type ProjectRow = {
  id: string
  name: string
  status: string
  credit_balance: number
  credit_alert_threshold: number | null
  access_until: string | null
  organizations: { name: string } | { name: string }[] | null
}

function organizationName(
  embed: ProjectRow["organizations"],
): string {
  if (!embed) return ""
  const row = Array.isArray(embed) ? embed[0] : embed
  return row?.name ?? ""
}

function toProjectContext(row: ProjectRow): SupportNotificationProjectContext {
  return {
    projectId: row.id,
    projectName: row.name,
    organizationName: organizationName(row.organizations),
    creditBalance: row.credit_balance,
    creditAlertThreshold: row.credit_alert_threshold,
    accessUntil: row.access_until,
  }
}

export async function evaluateProjectCreditAlert(
  admin: SupabaseClient,
  projectId: string,
): Promise<void> {
  const { data: project, error: projectError } = await admin
    .from("projects")
    .select(
      "id, credit_balance, credit_alert_threshold",
    )
    .eq("id", projectId)
    .maybeSingle()

  if (projectError) {
    throw new Error(projectError.message)
  }
  if (!project) {
    throw new Error("Project not found.")
  }

  const creditBalance = project.credit_balance as number
  const creditAlertThreshold = project.credit_alert_threshold as number | null

  if (
    shouldClearCreditLowLog({
      creditBalance,
      creditAlertThreshold,
    })
  ) {
    const { error } = await admin
      .from("support_notification_log")
      .delete()
      .eq("project_id", projectId)
      .eq("event_key", "credit_low")

    if (error) {
      throw new Error(error.message)
    }
    return
  }

  const { data: existingLog, error: logError } = await admin
    .from("support_notification_log")
    .select("id")
    .eq("project_id", projectId)
    .eq("event_key", "credit_low")
    .maybeSingle()

  if (logError) {
    throw new Error(logError.message)
  }

  if (
    !shouldQueueCreditLowAlert({
      creditBalance,
      creditAlertThreshold,
      previousCreditBalance: null,
      hasExistingCreditLowLog: Boolean(existingLog),
    })
  ) {
    return
  }

  const { error: insertError } = await admin.from("support_notification_log").upsert(
    {
      notification_type: "credit_balance_low",
      project_id: projectId,
      event_key: "credit_low",
      status: "pending",
      sent_at: null,
    },
    { onConflict: "notification_type,project_id,event_key" },
  )

  if (insertError) {
    throw new Error(insertError.message)
  }
}

export async function processPendingSupportNotifications(
  admin: SupabaseClient,
): Promise<{ processed: number; sent: number; failed: number }> {
  const { data: pendingRows, error } = await admin
    .from("support_notification_log")
    .select("id, notification_type, project_id, event_key, status, sent_at, created_at")
    .eq("status", "pending")
    .eq("notification_type", "credit_balance_low")
    .order("created_at", { ascending: true })
    .limit(50)

  if (error) {
    throw new Error(error.message)
  }

  let sent = 0
  let failed = 0

  for (const row of (pendingRows ?? []) as SupportNotificationLogRow[]) {
    const { data: project, error: projectError } = await admin
      .from("projects")
      .select(
        "id, name, status, credit_balance, credit_alert_threshold, access_until, organizations(name)",
      )
      .eq("id", row.project_id)
      .maybeSingle()

    if (projectError || !project) {
      failed += 1
      continue
    }

    const projectRow = project as ProjectRow
    const context = toProjectContext(projectRow)

    const result = await sendSupportNotificationEmail({
      admin,
      notificationType: "credit_balance_low",
      context,
    })

    if (!result.ok) {
      failed += 1
      continue
    }

    if (result.skipped) {
      await admin
        .from("support_notification_log")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", row.id)
      sent += 1
      continue
    }

    const { error: markError } = await admin
      .from("support_notification_log")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", row.id)

    if (markError) {
      failed += 1
      continue
    }

    sent += 1
  }

  return {
    processed: pendingRows?.length ?? 0,
    sent,
    failed,
  }
}

export async function processAccessExpirySupportNotifications(
  admin: SupabaseClient,
): Promise<{ checked: number; sent: number; failed: number }> {
  const { data: projects, error } = await admin
    .from("projects")
    .select(
      "id, name, status, credit_balance, credit_alert_threshold, access_until, organizations(name)",
    )
    .eq("status", "live")
    .not("access_until", "is", null)

  if (error) {
    throw new Error(error.message)
  }

  let sent = 0
  let failed = 0

  for (const project of (projects ?? []) as ProjectRow[]) {
    if (!project.access_until) continue

    const daysUntil = utcCalendarDaysUntil(project.access_until)
    if (!shouldSendExpiryReminder(daysUntil)) continue

    const notificationType = notificationTypeForExpiryDays(daysUntil)
    const eventKey = eventKeyForExpiryDays(daysUntil)
    if (!notificationType || !eventKey) continue

    const { data: existingLog, error: logError } = await admin
      .from("support_notification_log")
      .select("id")
      .eq("notification_type", notificationType)
      .eq("project_id", project.id)
      .eq("event_key", eventKey)
      .maybeSingle()

    if (logError) {
      failed += 1
      continue
    }
    if (existingLog) continue

    const context: SupportNotificationProjectContext = {
      ...toProjectContext(project),
      daysUntilAccessEnd: daysUntil,
    }

    const result = await sendSupportNotificationEmail({
      admin,
      notificationType,
      context,
    })

    if (!result.ok) {
      failed += 1
      continue
    }

    const { error: insertError } = await admin.from("support_notification_log").insert({
      notification_type: notificationType,
      project_id: project.id,
      event_key: eventKey,
      status: "sent",
      sent_at: new Date().toISOString(),
    })

    if (insertError) {
      failed += 1
      continue
    }

    sent += 1
  }

  return {
    checked: projects?.length ?? 0,
    sent,
    failed,
  }
}
