"use client"

import { createBrowserClient, type SupabaseClient } from "@supabase/ssr"
import { getSupabaseAnonConfig } from "@/lib/supabase/config"

/**
 * Browser Supabase client with cookie-backed session (via @supabase/ssr).
 * Pairs with root `middleware.ts` and `getSupabaseServerClient()` so `/api/*` routes receive auth cookies.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const config = getSupabaseAnonConfig()
  if (!config) return null
  return createBrowserClient(config.url, config.anonKey)
}
