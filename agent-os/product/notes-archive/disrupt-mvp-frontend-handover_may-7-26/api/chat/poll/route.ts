import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pollLimiter } from "@/lib/rate-limit";

/**
 * GET /api/chat/poll?request_id=<uuid>
 *
 * Polls the chat_results table for a completed result.
 * Used as a fallback when the n8n webhook times out (Cloudflare 524).
 *
 * Returns:
 *   202 — still processing (no row found)
 *   200 — result ready (with payload)
 *   400 — bad request (missing/invalid request_id)
 */
export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get("request_id");

  if (!requestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
    return NextResponse.json(
      { error: "Invalid or missing request_id" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Auth check — defense-in-depth (RLS also filters by org)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit
  const rl = pollLimiter.check(user.id);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  // Fetch user's organization for isolation
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id;

  const query = supabase
    .from("chat_results")
    .select("status, result_payload")
    .eq("request_id", requestId);

  // Security: scope results to user's organization to prevent cross-org data leaks
  if (orgId) {
    query.eq("organization_id", orgId);
  }

  const { data } = await query.single();

  if (!data) {
    // No row yet — n8n hasn't finished writing the result
    return NextResponse.json({ status: "processing" }, { status: 202 });
  }

  return NextResponse.json({
    status: data.status,
    result: data.result_payload,
  });
}
