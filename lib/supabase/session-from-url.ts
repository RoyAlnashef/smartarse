import type { SupabaseClient } from "@supabase/supabase-js"

export type EstablishSessionResult =
  | { ok: true; source: "hash" | "code" | "existing" }
  | { ok: false; reason: "no_client" | "no_tokens" | "error"; message?: string }

/** Parse `#access_token=...&refresh_token=...` from a Supabase implicit-flow redirect. */
export function parseAuthHashParams(hash: string): {
  accessToken: string | null
  refreshToken: string | null
} {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash
  if (!normalized) {
    return { accessToken: null, refreshToken: null }
  }
  const params = new URLSearchParams(normalized)
  return {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
  }
}

function clearUrlCredentials(): void {
  const path = window.location.pathname + window.location.search
  window.history.replaceState(null, "", path)
}

/**
 * Establishes a Supabase session from magic-link / recovery tokens in the URL.
 * Required for @supabase/ssr cookie sessions: hash fragments never reach middleware.
 */
export async function establishSessionFromUrl(
  supabase: SupabaseClient
): Promise<EstablishSessionResult> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "no_client" }
  }

  const hash = window.location.hash
  const { accessToken, refreshToken } = parseAuthHashParams(hash)

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (error) {
      return { ok: false, reason: "error", message: error.message }
    }
    clearUrlCredentials()
    return { ok: true, source: "hash" }
  }

  const code = new URLSearchParams(window.location.search).get("code")
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return { ok: false, reason: "error", message: error.message }
    }
    clearUrlCredentials()
    return { ok: true, source: "code" }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.user) {
    return { ok: true, source: "existing" }
  }

  return { ok: false, reason: "no_tokens" }
}
