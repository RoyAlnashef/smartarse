/** Shared URL + anon key for browser, server, and middleware clients. */
export function getSupabaseAnonConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
  if (!url?.trim() || !anonKey?.trim()) return null
  return { url: url.trim(), anonKey: anonKey.trim() }
}
