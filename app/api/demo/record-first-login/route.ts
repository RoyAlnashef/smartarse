import { NextResponse } from "next/server"
import { recordDemoFirstLoginIfNeeded } from "@/lib/demo-access/first-login"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST() {
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

  if (authError || !user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    const adminClient = getSupabaseAdminClient()
    const result = await recordDemoFirstLoginIfNeeded(adminClient, {
      userId: user.id,
      email: user.email,
    })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record login."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
