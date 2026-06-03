import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupportNotificationEmail as getEnvSupportNotificationEmail } from "@/lib/support-notification-email"
import { loadPlatformSettings } from "@/lib/support-notifications/platform-settings"

/**
 * Resolve the Disrupt support inbox for outbound notification emails.
 * `DEMO_NOTIFICATION_EMAIL` env override wins (local/testing); else DB singleton; else constant.
 */
export async function resolveSupportNotificationEmail(
  admin?: SupabaseClient,
): Promise<string> {
  const envOverride = process.env.DEMO_NOTIFICATION_EMAIL?.trim()
  if (envOverride) return envOverride

  if (admin) {
    try {
      const settings = await loadPlatformSettings(admin)
      if (settings.supportEmail.trim()) {
        return settings.supportEmail.trim()
      }
    } catch {
      // Fall through to constant when settings table is unavailable.
    }
  }

  return getEnvSupportNotificationEmail()
}
