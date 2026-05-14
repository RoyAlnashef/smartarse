import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/chat/claim
 * Sets user_id on a chat_results row after the n8n agent responds.
 * This avoids modifying the n8n pipeline (Issue #24 risk).
 *
 * Body: { request_id: string }
 * Phase 65: Per-user chat history.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const requestId = body?.request_id;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid request_id" },
        { status: 400 }
      );
    }

    // Get user's org
    const { data: profile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    // Stamp user_id on the chat_results row (idempotent — user_id IS NULL guard)
    const { error } = await supabase
      .from("chat_results")
      .update({ user_id: user.id })
      .eq("request_id", requestId)
      .eq("organization_id", profile.organization_id)
      .is("user_id", null);

    if (error) {
      console.error("Chat claim error:", error.message);
      return NextResponse.json(
        { error: "Failed to claim" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Chat claim error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
