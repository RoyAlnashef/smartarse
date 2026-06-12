import { cache } from "react"
import { unstable_noStore as noStore } from "next/cache"
import { SUPPORT_EMAIL } from "@/lib/support-contact"
import { loadPlatformSettings } from "@/lib/support-notifications/platform-settings"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

async function resolveClientSupportContactEmail(): Promise<string> {
  noStore()
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

/** Support inbox shown to client users (from platform settings, with constant fallback). */
export const getClientSupportContactEmail = cache(resolveClientSupportContactEmail)
