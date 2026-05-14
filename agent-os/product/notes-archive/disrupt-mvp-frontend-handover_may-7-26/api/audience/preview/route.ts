import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { personaLimiter } from "@/lib/rate-limit";
import {
  parseFilters,
  buildFiltersSummary,
  AUDIENCE_TOTAL_N,
  computePopulationBaselines,
  computeInsights,
} from "@/lib/audience-query";

/**
 * POST /api/audience/preview
 * Lightweight audience size + avg concern preview.
 * Called on every filter change (debounced 300ms on frontend).
 *
 * Phase 41a: Audience Builder
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

    // Fetch all respondent data + segment assignments
    // Using two queries and joining in JS (Supabase client can't do complex JSONB JOINs)
    const [rowsRes, segRes] = await Promise.all([
      supabase.from("tabular_document_rows").select("row_data"),
      supabase
        .from("model_segments_assignments")
        .select("respondent_uuid, segment_id")
        .eq("dataset_id", 9)
        .gt("segment_id", 0),
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

    // Phase 44c: Single-pass accumulation for BOTH population and filtered audience
    // Population baselines collected for all assigned respondents (segment > 0)
    const popValues: { concern: number; influence: number; optimism: number; actions: number }[] = [];

    // Filtered audience accumulators
    let count = 0;
    let totalConcern = 0;
    let totalInfluence = 0;
    let totalOptimism = 0;
    let totalActions = 0;

    // Check if any filters are actually active (used to skip insight computation when "all")
    const hasActiveFilters =
      filters.segment_ids.length > 0 ||
      filters.countries.length > 0 ||
      filters.genders.length > 0 ||
      (filters.age_min !== undefined) ||
      (filters.age_max !== undefined) ||
      (filters.concern_min !== undefined) ||
      (filters.concern_max !== undefined) ||
      filters.ethnicities.length > 0 ||
      filters.religions.length > 0 ||
      filters.area_types.length > 0 ||
      filters.industries.length > 0;

    for (const row of rowsRes.data) {
      const d = (row.row_data as Record<string, Record<string, unknown>>)
        ?.data_rows;
      if (!d) continue;

      const uuid = d.uuid as string;
      const segmentId = segMap.get(uuid);
      if (segmentId === undefined) continue; // not assigned to a segment

      // Extract metrics for population baselines (all assigned respondents)
      const concern = Number(d.Q4) || 0;
      const influence = Number(d.Q7) || 0;
      const optimism = Number(d.Q8) || 0;
      // Actions: count of Q9r1-Q9r10 where value = 1
      let actionCount = 0;
      for (let i = 1; i <= 10; i++) {
        if (Number(d[`Q9r${i}`]) === 1) actionCount++;
      }

      popValues.push({ concern, influence, optimism, actions: actionCount });

      // Apply filters for audience subset
      if (filters.segment_ids.length > 0 && !filters.segment_ids.includes(segmentId)) continue;
      if (filters.countries.length > 0 && !filters.countries.includes(d.country_label as string)) continue;
      if (filters.genders.length > 0 && !filters.genders.includes(d.GENDER_label as string)) continue;

      const age = Number(d.AGE_label) || Number(d.AGE) || 0;
      if (filters.age_min !== undefined && age < filters.age_min) continue;
      if (filters.age_max !== undefined && age > filters.age_max) continue;

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

      count++;
      totalConcern += concern;
      totalInfluence += influence;
      totalOptimism += optimism;
      totalActions += actionCount;
    }

    // Phase 44c: Compute insights (only when filters are active and audience is meaningful)
    let insights: import("@/lib/types").AudienceInsight[] = [];
    if (hasActiveFilters && count >= 5) {
      const popBaselines = computePopulationBaselines(popValues);
      const audienceMetrics = {
        avgConcern: count > 0 ? totalConcern / count : 0,
        avgInfluence: count > 0 ? totalInfluence / count : 0,
        avgOptimism: count > 0 ? totalOptimism / count : 0,
        avgActions: count > 0 ? totalActions / count : 0,
      };
      insights = computeInsights(audienceMetrics, popBaselines);
    }

    return NextResponse.json({
      n: count,
      sharePct: count > 0 ? Math.round((count / AUDIENCE_TOTAL_N) * 1000) / 10 : 0,
      avgConcern: count > 0 ? Math.round((totalConcern / count) * 100) / 100 : 0,
      filters_summary: buildFiltersSummary(filters),
      insights,
    });
  } catch (err) {
    console.error("Audience preview error:", err);
    return NextResponse.json(
      { error: "Failed to compute audience preview" },
      { status: 500 }
    );
  }
}
