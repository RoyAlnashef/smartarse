import { SUPPORT_EMAIL } from "@/lib/support-contact"
import { loadPlatformSettings } from "@/lib/support-notifications/platform-settings"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

/** Support inbox shown to dashboard users (from platform settings, with constant fallback). */
export async function getClientSupportContactEmail(): Promise<string> {
  try {
    const admin = getSupabaseAdminClient()
    const settings = await loadPlatformSettings(admin)
    const email = settings.supportEmail.trim()
    if (email) return email
  } catch {
    // Fall through when settings are unavailable (e.g. local dev without service role).
  }

  return SUPPORT_EMAIL
}
