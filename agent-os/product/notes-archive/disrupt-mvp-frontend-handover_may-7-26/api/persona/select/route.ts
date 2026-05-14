import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { personaLimiter } from "@/lib/rate-limit";
import { SEGMENT_PROFILES } from "@/lib/segments";

/* ── Constants ─────────────────────────────────────────────────────── */

const VALID_SEGMENTS = [1, 2, 3, 4];

/* ── POST handler ──────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ── Auth check ────────────────────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    const rl = personaLimiter.check(user.id);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = await request.json();
    const { segment_id } = body;

    // Validate input
    if (!VALID_SEGMENTS.includes(segment_id)) {
      return NextResponse.json(
        { error: `Invalid segment_id. Must be one of: ${VALID_SEGMENTS.join(", ")}` },
        { status: 400 }
      );
    }

    // Phase 40: Return pre-computed segment profile (no DB query needed)
    const profile = SEGMENT_PROFILES[segment_id];

    return NextResponse.json({ persona: profile });
  } catch (err) {
    console.error("Persona selection error:", err);
    return NextResponse.json(
      { error: "Failed to select persona" },
      { status: 500 }
    );
  }
}
