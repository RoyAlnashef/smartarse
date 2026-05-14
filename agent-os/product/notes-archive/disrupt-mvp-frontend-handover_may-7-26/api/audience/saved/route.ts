import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildFiltersSummary } from "@/lib/audience-query";
import { AudienceFilters } from "@/lib/types";

const SAVE_LIMIT = 3;
const MIN_BASE_SIZE = 50;

/**
 * GET /api/audience/saved
 * Returns all saved audience cards for the authenticated user.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("saved_audiences")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("GET /api/audience/saved error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/audience/saved
 * Saves a new custom audience card (max 3 per user).
 *
 * Body: { name, description?, filters, base_size, avg_concern }
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

    // Get org ID
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, filters, base_size, avg_concern } = body as {
      name: string;
      description?: string;
      filters: AudienceFilters;
      base_size: number;
      avg_concern: number;
    };

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (typeof base_size !== "number") {
      return NextResponse.json({ error: "base_size is required" }, { status: 400 });
    }

    // Base size gate
    if (base_size < MIN_BASE_SIZE) {
      return NextResponse.json(
        { error: "Audience too small", n: base_size, min: MIN_BASE_SIZE },
        { status: 400 }
      );
    }

    // Per-user limit check — also fetch existing slots so we can assign the lowest free one
    const { data: existing, error: countError } = await supabase
      .from("saved_audiences")
      .select("id, color_slot")
      .eq("user_id", user.id);

    if (countError) throw countError;

    if ((existing?.length ?? 0) >= SAVE_LIMIT) {
      return NextResponse.json(
        { error: "Limit reached", limit: SAVE_LIMIT },
        { status: 429 }
      );
    }

    // Assign the lowest free colour slot (0, 1, or 2)
    const usedSlots = new Set((existing ?? []).map((r) => r.color_slot));
    const color_slot = [0, 1, 2].find((s) => !usedSlots.has(s)) ?? 0;

    // Build a clean summary string from filters
    const filters_summary = buildFiltersSummary(filters as AudienceFilters);

    const { data, error: insertError } = await supabase
      .from("saved_audiences")
      .insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        name: name.trim(),
        description: description?.trim() || null,
        filters,
        base_size,
        avg_concern: avg_concern ?? null,
        filters_summary,
        color_slot,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/audience/saved error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
