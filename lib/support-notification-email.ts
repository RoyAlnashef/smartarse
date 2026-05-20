import { SUPPORT_EMAIL } from "@/lib/support-contact"

/**
 * Inbox for demo-access approval notifications (not footer "Contact the team").
 * Override with DEMO_NOTIFICATION_EMAIL for local/testing; replace with company
 * settings lookup when that page exists.
 */
export function getSupportNotificationEmail(): string {
  const override = process.env.DEMO_NOTIFICATION_EMAIL?.trim()
  if (override) return override
  return SUPPORT_EMAIL
}
