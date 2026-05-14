import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/credits/balance
 *
 * Returns the current credit balance for the authenticated user's org.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get org_id from users table
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: "No organization" }, { status: 403 });
  }

  // Fetch balance
  const { data: org } = await supabase
    .from("organizations")
    .select("credit_balance")
    .eq("id", profile.organization_id)
    .single();

  return NextResponse.json({
    balance: org?.credit_balance ?? 0,
  });
}
