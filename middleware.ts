import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAnonConfig } from "@/lib/supabase/config"

const ADMIN_SHELL =
  /^\/(dashboard|projects|users|organizations|demo-requests|analytics|documents|settings|faq|privacy)(\/|$)/

/** Client workspace routes that require a session (excluding public marketing pages). */
const CLIENT_SHELL = /^\/client(\/|$)/

/**
 * Refreshes Supabase Auth cookies on each matched request so Route Handlers
 * (e.g. /api/chat/*) see the same session as the browser client.
 *
 * Also redirects unauthenticated visitors away from admin/client shells.
 */
export async function middleware(request: NextRequest) {
  const config = getSupabaseAnonConfig()
  if (!config) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const needsSession =
    (ADMIN_SHELL.test(path) || CLIENT_SHELL.test(path)) &&
    !path.startsWith("/auth/")

  if (needsSession && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/"
    loginUrl.search = ""
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
