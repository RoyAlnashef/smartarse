import { NextResponse } from "next/server"
import { userRequiresPasswordSetup } from "@/lib/demo-access/password-setup"
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

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const appMetadata = user.app_metadata as Record<string, unknown> | undefined
  if (!userRequiresPasswordSetup(appMetadata)) {
    return NextResponse.json({ ok: true, alreadyComplete: true })
  }

  if (appMetadata?.demo_user !== true) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  }

  try {
    const adminClient = getSupabaseAdminClient()
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          ...appMetadata,
          requires_password_setup: false,
        },
      }
    )
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to complete setup."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
