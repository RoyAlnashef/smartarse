import { createServerClient, type SupabaseClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAnonConfig } from "@/lib/supabase/config"

/**
 * Supabase client for Route Handlers — reads request cookies and writes session
 * cookies onto the supplied NextResponse (required for redirects after auth exchange).
 */
export function createSupabaseRouteHandlerClient(
  request: NextRequest,
  response: NextResponse,
): SupabaseClient | null {
  const config = getSupabaseAnonConfig()
  if (!config) return null

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })
}
