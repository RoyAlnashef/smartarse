import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { personaLimiter } from "@/lib/rate-limit";
import { parseFilters } from "@/lib/audience-query";
import { getSegmentName } from "@/lib/segments";
import type { RespondentPreview } from "@/lib/types";

/**
 * POST /api/audience/respondents
 * Returns a list of individual respondents matching audience filters.
 * Used by the RespondentBrowser component for Digital Twin deep-dive.
 *
 * Phase 41b: Individual Digital Twin Deep-Dive
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

    const rl = personaLimiter.check(user.id);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = await request.json();
    const filters = parseFilters(body);
    const offset = typeof body.offset === "number" ? Math.max(0, body.offset) : 0;
    const limit = typeof body.limit === "number" ? Math.min(Math.max(1, body.limit), 50) : 10;

    // Fetch respondent data + segment assignments + Q1 verbatims + verbatim counts
    const [rowsRes, segRes, verbRes, verbCountRes] = await Promise.all([
      supabase.from("tabular_document_rows").select("row_data"),
      supabase
        .from("model_segments_assignments")
        .select("respondent_uuid, segment_id")
        .eq("dataset_id", 9)
        .gt("segment_id", 0),
      supabase
        .from("v_open_ends")
        .select("respondent_uuid, response_text")
        .eq("question_code", "Q1")
        .not("response_text", "is", null),
      supabase
        .from("v_open_ends")
        .select("respondent_uuid"),
    ]);

    if (rowsRes.error || !rowsRes.data || segRes.error || !segRes.data) {
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 }
      );
    }

    // Build segment lookup
    const segMap = new Map<string, number>();
    for (const s of segRes.data) {
      segMap.set(s.respondent_uuid, s.segment_id);
    }

    // Build Q1 verbatim lookup
    const q1Map = new Map<string, string>();
    for (const v of verbRes.data || []) {
      if (v.response_text && v.response_text.trim().length > 5) {
        q1Map.set(v.respondent_uuid, v.response_text.trim());
      }
    }

    // Build verbatim count lookup
    const verbCounts = new Map<string, number>();
    for (const v of verbCountRes.data || []) {
      verbCounts.set(v.respondent_uuid, (verbCounts.get(v.respondent_uuid) || 0) + 1);
    }

    // Filter respondents and build previews
    const previews: RespondentPreview[] = [];

    for (const row of rowsRes.data) {
      const d = (row.row_data as Record<string, Record<string, unknown>>)
        ?.data_rows;
      if (!d) continue;

      const uuid = d.uuid as string;
      const segmentId = segMap.get(uuid);
      if (segmentId === undefined) continue;

      // Apply filters (same logic as preview/profile endpoints)
      if (filters.segment_ids.length > 0 && !filters.segment_ids.includes(segmentId)) continue;
      if (filters.countries.length > 0 && !filters.countries.includes(d.country_label as string)) continue;
      if (filters.genders.length > 0 && !filters.genders.includes(d.GENDER_label as string)) continue;

      const age = Number(d.AGE_label) || Number(d.AGE) || 0;
      if (filters.age_min !== undefined && age < filters.age_min) continue;
      if (filters.age_max !== undefined && age > filters.age_max) continue;

      const concern = Number(d.Q4) || 0;
      if (filters.concern_min !== undefined && concern < filters.concern_min) continue;
      if (filters.concern_max !== undefined && concern > filters.concern_max) continue;

      if (filters.ethnicities.length > 0) {
        const eth = (d.Ethnicity_label as string) || "";
        if (!filters.ethnicities.includes(eth)) continue;
      }
      if (filters.religions.length > 0) {
        const rel = (d.Q25_label as string) || "";
        if (!filters.religions.includes(rel)) continue;
      }
      if (filters.area_types.length > 0) {
        const area = (d.Q23_label as string) || "";
        if (!filters.area_types.includes(area)) continue;
      }
      if (filters.industries.length > 0) {
        const ind = (d.Q22_label as string) || "";
        if (!filters.industries.includes(ind)) continue;
      }

      const gender = (d.GENDER_label as string) || "Unknown";
      const country = (d.country_label as string) || "Unknown";
      const q1 = q1Map.get(uuid) || "";
      const vCount = verbCounts.get(uuid) || 0;

      previews.push({
        uuid,
        age,
        gender,
        country,
        segment_id: segmentId,
        segment_name: getSegmentName(segmentId),
        concern_level: concern,
        q1_preview: q1.length > 100 ? q1.slice(0, 100) + "..." : q1,
        verbatim_count: vCount,
      });
    }

    // Sort by verbatim count DESC (richest data first), then concern DESC
    previews.sort((a, b) => {
      if (b.verbatim_count !== a.verbatim_count) return b.verbatim_count - a.verbatim_count;
      return b.concern_level - a.concern_level;
    });

    const total = previews.length;
    const paged = previews.slice(offset, offset + limit);

    return NextResponse.json({
      respondents: paged,
      total_n: total,
      offset,
      limit,
    });
  } catch (err) {
    console.error("Audience respondents error:", err);
    return NextResponse.json(
      { error: "Failed to fetch respondents" },
      { status: 500 }
    );
  }
}
