import type { SupabaseClient } from "@supabase/supabase-js"
import { SUPPORT_EMAIL } from "@/lib/support-contact"
import type {
  PlatformSettings,
  PlatformSettingsRow,
  SupportNotificationType,
} from "@/lib/support-notifications/types"

const PLATFORM_SETTINGS_ID = "default"

export function rowToPlatformSettings(row: PlatformSettingsRow): PlatformSettings {
  return {
    supportEmail: row.support_email,
    notifyCreditBalanceLow: row.notify_credit_balance_low,
    notifyAccessExpires4Weeks: row.notify_access_expires_4_weeks,
    notifyAccessExpires2Weeks: row.notify_access_expires_2_weeks,
  }
}

export function defaultPlatformSettings(): PlatformSettings {
  return {
    supportEmail: SUPPORT_EMAIL,
    notifyCreditBalanceLow: true,
    notifyAccessExpires4Weeks: true,
    notifyAccessExpires2Weeks: true,
  }
}

export async function loadPlatformSettings(
  admin: SupabaseClient,
): Promise<PlatformSettings> {
  const { data, error } = await admin
    .from("platform_settings")
    .select(
      "id, support_email, notify_credit_balance_low, notify_access_expires_4_weeks, notify_access_expires_2_weeks, updated_at",
    )
    .eq("id", PLATFORM_SETTINGS_ID)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return defaultPlatformSettings()
  }

  return rowToPlatformSettings(data as PlatformSettingsRow)
}

export async function savePlatformSettings(
  admin: SupabaseClient,
  input: PlatformSettings,
): Promise<PlatformSettings> {
  const patch = {
    support_email: input.supportEmail.trim(),
    notify_credit_balance_low: input.notifyCreditBalanceLow,
    notify_access_expires_4_weeks: input.notifyAccessExpires4Weeks,
    notify_access_expires_2_weeks: input.notifyAccessExpires2Weeks,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from("platform_settings")
    .update(patch)
    .eq("id", PLATFORM_SETTINGS_ID)
    .select(
      "id, support_email, notify_credit_balance_low, notify_access_expires_4_weeks, notify_access_expires_2_weeks, updated_at",
    )
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return rowToPlatformSettings(data as PlatformSettingsRow)
}

export function isNotificationTypeEnabled(
  settings: PlatformSettings,
  notificationType: SupportNotificationType,
): boolean {
  switch (notificationType) {
    case "credit_balance_low":
      return settings.notifyCreditBalanceLow
    case "access_expires_4_weeks":
      return settings.notifyAccessExpires4Weeks
    case "access_expires_2_weeks":
      return settings.notifyAccessExpires2Weeks
  }
}
