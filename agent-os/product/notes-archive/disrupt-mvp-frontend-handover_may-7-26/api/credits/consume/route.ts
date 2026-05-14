import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { creditConsumeLimiter } from "@/lib/rate-limit";

/**
 * POST /api/credits/consume
 *
 * Atomically deducts credits from the authenticated user's org.
 * Uses a PostgreSQL SECURITY DEFINER function with FOR UPDATE lock.
 *
 * Body: { amount: number, reference_id?: string, description?: string }
 * Returns: { success: boolean, balance: number } or 402 if insufficient
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit
  const rl = creditConsumeLimiter.check(user.id);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const body = await request.json();
  const { amount, reference_id, description } = body;

  if (!amount || typeof amount !== "number" || !Number.isInteger(amount) || amount < 1 || amount > 100) {
    return NextResponse.json(
      { error: "Invalid amount (must be integer 1-100)" },
      { status: 400 }
    );
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

  // Atomic deduction via PG function
  const { data, error } = await supabase.rpc("consume_credits", {
    p_org_id: profile.organization_id,
    p_amount: amount,
    p_reference_id: reference_id || null,
    p_description: (description || "").slice(0, 200) || null,
  });

  if (error) {
    console.error("consume_credits RPC error:", error);
    return NextResponse.json(
      { error: "Credit deduction failed" },
      { status: 500 }
    );
  }

  const result = data as { success: boolean; balance?: number; error?: string };

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error || "Insufficient credits",
        balance: result.balance ?? 0,
      },
      { status: 402 }
    );
  }

  return NextResponse.json({
    success: true,
    balance: result.balance,
  });
}
