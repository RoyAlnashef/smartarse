import type {
  SupportNotificationEventKey,
  SupportNotificationType,
} from "@/lib/support-notifications/types"

export function notificationTypeForExpiryDays(
  daysUntil: number,
): SupportNotificationType | null {
  if (daysUntil === 28) return "access_expires_4_weeks"
  if (daysUntil === 14) return "access_expires_2_weeks"
  return null
}

export function eventKeyForExpiryDays(
  daysUntil: number,
): SupportNotificationEventKey | null {
  if (daysUntil === 28) return "access_28d"
  if (daysUntil === 14) return "access_14d"
  return null
}

export function shouldSendExpiryReminder(daysUntil: number): boolean {
  return daysUntil === 28 || daysUntil === 14
}

/** True when balance crossed below threshold (or first alert with no prior log). */
export function shouldQueueCreditLowAlert(options: {
  creditBalance: number
  creditAlertThreshold: number | null
  previousCreditBalance: number | null
  hasExistingCreditLowLog: boolean
}): boolean {
  const { creditBalance, creditAlertThreshold, previousCreditBalance, hasExistingCreditLowLog } =
    options

  if (creditAlertThreshold == null || creditAlertThreshold <= 0) {
    return false
  }

  if (creditBalance >= creditAlertThreshold) {
    return false
  }

  if (previousCreditBalance != null && previousCreditBalance >= creditAlertThreshold) {
    return true
  }

  return !hasExistingCreditLowLog
}

export function shouldClearCreditLowLog(options: {
  creditBalance: number
  creditAlertThreshold: number | null
}): boolean {
  const { creditBalance, creditAlertThreshold } = options
  if (creditAlertThreshold == null) return true
  return creditBalance >= creditAlertThreshold
}
