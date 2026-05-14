import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 5;
const MAX_ITEMS = 20;
/** Fetch extra rows to account for duplicates being removed */
const FETCH_BUFFER = 60;

/**
 * GET /api/chat/history?page=1
 * Returns paginated per-user chat history (last 20 unique queries, 5 per page).
 * Deduplicates by user_query text (keeps most recent occurrence).
 * Phase 71: Widened user_id filter to include org-level seeded entries (user_id IS NULL).
 * Phase 65: Per-user filtering + pagination + dedup.
 * Phase 39 origin: Past questions feature.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's org (FIX: was "profiles", should be "users")
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[ChatHistory] users table query failed:", profileError.message, "userId:", user.id);
    }

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "No organization", detail: profileError?.message || "profile lookup returned null", userId: user.id },
        { status: 400 }
      );
    }

    // Parse pagination
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    // Fetch a larger batch (most recent first), then deduplicate in JS
    // Phase 71: Widened user_id filter to include org-level seeded entries (user_id IS NULL)
    // so that Phase 70 verified test results appear in ChatHistory for all org users.
    const { data, error } = await supabase
      .from("chat_results")
      .select("id, user_query, created_at, status")
      .eq("organization_id", profile.organization_id)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .not("user_query", "is", null)
      .neq("user_query", "")
      .neq("status", "error_fallback")
      .order("created_at", { ascending: false })
      .limit(FETCH_BUFFER);

    if (error) {
      console.error("Chat history query error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch history" },
        { status: 500 }
      );
    }

    // Deduplicate by user_query (case-insensitive, keep most recent)
    const seen = new Set<string>();
    const unique = (data ?? []).filter((item) => {
      const key = item.user_query.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Cap at MAX_ITEMS unique entries
    const capped = unique.slice(0, MAX_ITEMS);
    const totalItems = capped.length;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    // Paginate the deduped list in JS
    const offset = (page - 1) * PAGE_SIZE;
    const pageItems = capped.slice(offset, offset + PAGE_SIZE);

    return NextResponse.json({
      history: pageItems,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalItems,
        totalPages,
      },
    });
  } catch (err) {
    console.error("Chat history error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
