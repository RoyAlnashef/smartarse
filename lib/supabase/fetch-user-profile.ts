import type { SupabaseClient } from "@supabase/supabase-js"

/** Row shape from `public.users` (snake_case as returned by PostgREST). */
export interface PublicUserRow {
  id: string
  email: string | null
  role: string | null
  organization_id: string | null
  status: string | null
  created_at: string | null
}

/**
 * Loads the app profile row for the signed-in auth user.
 * Returns null if the row is missing, RLS denies access, or the request errors.
 */
export async function fetchPublicUserRow(
  supabase: SupabaseClient,
  authUserId: string
): Promise<PublicUserRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id,email,role,organization_id,status,created_at")
    .eq("id", authUserId)
    .maybeSingle()

  if (error || !data) return null
  return data as PublicUserRow
}
