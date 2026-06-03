export const SUPPORT_NOTIFICATION_TYPES = [
  "credit_balance_low",
  "access_expires_4_weeks",
  "access_expires_2_weeks",
] as const

export type SupportNotificationType =
  (typeof SUPPORT_NOTIFICATION_TYPES)[number]

export const SUPPORT_NOTIFICATION_EVENT_KEYS = [
  "credit_low",
  "access_28d",
  "access_14d",
] as const

export type SupportNotificationEventKey =
  (typeof SUPPORT_NOTIFICATION_EVENT_KEYS)[number]

export type PlatformSettingsRow = {
  id: string
  support_email: string
  notify_credit_balance_low: boolean
  notify_access_expires_4_weeks: boolean
  notify_access_expires_2_weeks: boolean
  updated_at: string
}

export type PlatformSettings = {
  supportEmail: string
  notifyCreditBalanceLow: boolean
  notifyAccessExpires4Weeks: boolean
  notifyAccessExpires2Weeks: boolean
}

export type SupportNotificationLogRow = {
  id: string
  notification_type: SupportNotificationType
  project_id: string
  event_key: SupportNotificationEventKey
  status: "pending" | "sent"
  sent_at: string | null
  created_at: string
}

export type SupportNotificationProjectContext = {
  projectId: string
  projectName: string
  organizationName: string
  creditBalance?: number
  creditAlertThreshold?: number | null
  accessUntil?: string | null
  daysUntilAccessEnd?: number
}
