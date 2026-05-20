import { NextResponse } from "next/server"
import { getDemoSessionForUser } from "@/lib/demo-access/session"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  let serverClient
  try {
    serverClient = await getSupabaseServerClient()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Server configuration error."
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const {
    data: { user },
    error: authError,
  } = await serverClient.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { isDemoUser: false, demoProjectId: null },
      { status: 200 }
    )
  }

  try {
    const adminClient = getSupabaseAdminClient()
    const session = await getDemoSessionForUser(adminClient, user.id)
    return NextResponse.json(session)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load demo session."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
