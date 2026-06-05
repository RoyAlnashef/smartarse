import type { SupabaseClient } from "@supabase/supabase-js"
import { sendTransactionalEmail } from "@/lib/email/send-transactional"
import { resolveSupportNotificationEmail } from "@/lib/support-notifications/get-recipient"
import {
  isNotificationTypeEnabled,
  loadPlatformSettings,
} from "@/lib/support-notifications/platform-settings"
import {
  renderAccessExpiresEmail,
  renderCreditBalanceLowEmail,
} from "@/lib/support-notifications/templates"
import type {
  SupportNotificationProjectContext,
  SupportNotificationType,
} from "@/lib/support-notifications/types"

export async function sendSupportNotificationEmail(options: {
  admin: SupabaseClient
  notificationType: SupportNotificationType
  context: SupportNotificationProjectContext
}): Promise<{ ok: true } | { ok: false; error: string; skipped?: boolean }> {
  const settings = await loadPlatformSettings(options.admin)
  if (!isNotificationTypeEnabled(settings, options.notificationType)) {
    return { ok: true, skipped: true }
  }

  const to = await resolveSupportNotificationEmail(options.admin)

  let rendered: { subject: string; html: string; text: string }
  switch (options.notificationType) {
    case "credit_balance_low":
      rendered = renderCreditBalanceLowEmail(options.context)
      break
    case "access_expires_4_weeks":
      rendered = renderAccessExpiresEmail(options.context, 28)
      break
    case "access_expires_2_weeks":
      rendered = renderAccessExpiresEmail(options.context, 14)
      break
  }

  const result = await sendTransactionalEmail({
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    internalNotification: true,
  })

  if (!result.ok) {
    return result
  }

  return { ok: true }
}
