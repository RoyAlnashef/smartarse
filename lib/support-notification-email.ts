import { SUPPORT_EMAIL } from "@/lib/support-contact"

/**
 * Inbox for internal Disrupt notifications (demo requests, support alerts).
 * Override with DEMO_NOTIFICATION_EMAIL for local/testing; production reads
 * `platform_settings.support_email` via `resolveSupportNotificationEmail()`.
 */
export function getSupportNotificationEmail(): string {
  const override = process.env.DEMO_NOTIFICATION_EMAIL?.trim()
  if (override) return override
  return SUPPORT_EMAIL
}
