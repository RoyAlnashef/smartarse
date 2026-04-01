import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseAnonConfig } from "@/lib/supabase/config"

export async function getSupabaseServerClient() {
  const config = getSupabaseAnonConfig()
  if (!config) {
    throw new Error("Supabase server client env vars are missing.")
  }

  const cookieStore = await cookies()

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          /* Server Components cannot set cookies; middleware refreshes session. */
        }
      },
    },
  })
}
