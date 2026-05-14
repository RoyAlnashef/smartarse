import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { personaLimiter } from "@/lib/rate-limit";
import { parseFilters, buildFiltersSummary, AUDIENCE_TOTAL_N } from "@/lib/audience-query";
import { buildSegmentBriefText, getSegmentName } from "@/lib/segments";
import {
  Q9_ACTIONS,
  Q11_BARRIERS,
  Q12_MOTIVATORS,
} from "@/lib/survey-codes";
import type { CustomAudienceProfile } from "@/lib/types";

/**
 * POST /api/audience/profile
 * Full dynamic aggregate profile for a custom audience.
 * Called once when user clicks "Explore This Audience".
 *
 * Computes: avg concern/influence/optimism/actions, top 5 actions/barriers/motivators with %,
 * sample Q1 verbatims, and generates the n8n brief_text.
 *
 * Phase 41a: Audience Builder
 */

/** Multi-code field definition: JSONB key prefix → labels map */
interface MultiCodeDef {
  codeMap: Record<string, string>;
  labelOverrides?: Record<string, string>;
}

const MULTI_CODE_FIELDS: Record<string, MultiCodeDef> = {
  actions: { codeMap: Q9_ACTIONS },
  barriers: { codeMap: Q11_BARRIERS },
  motivators: { codeMap: Q12_MOTIVATORS },
};

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

    // Fetch respondent data + segment assignments + Q1 verbatims
    const [rowsRes, segRes, verbRes] = await Promise.all([
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

    // Build verbatim lookup
    const verbMap = new Map<string, string>();
    for (const v of verbRes.data || []) {
      if (v.response_text && v.response_text.trim().length > 20) {
        verbMap.set(v.respondent_uuid, v.response_text.trim());
      }
    }

    // Filter respondents and accumulate stats
    const matchedUuids: string[] = [];
    let totalConcern = 0;
    let totalInfluence = 0;
    let totalOptimism = 0;
    let totalActions = 0;

    // Multi-code accumulators: code → count
    const actionCounts: Record<string, number> = {};
    const barrierCounts: Record<string, number> = {};
    const motivatorCounts: Record<string, number> = {};

    // Track segment distribution
    const segmentCounts: Record<number, number> = {};

    for (const row of rowsRes.data) {
      const d = (row.row_data as Record<string, Record<string, unknown>>)
        ?.data_rows;
      if (!d) continue;

      const uuid = d.uuid as string;
      const segmentId = segMap.get(uuid);
      if (segmentId === undefined) continue;

      // Apply filters
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

      // This respondent matches — accumulate
      matchedUuids.push(uuid);
      totalConcern += concern;
      totalInfluence += Number(d.Q7) || 0;
      totalOptimism += Number(d.Q8) || 0;

      // Count segment distribution
      segmentCounts[segmentId] = (segmentCounts[segmentId] || 0) + 1;

      // Count actions (Q9 multi-code: each Q9rX = 1 means selected)
      let actionCount = 0;
      for (const code of Object.keys(Q9_ACTIONS)) {
        if (d[code] === 1 || d[code] === "1") {
          actionCounts[code] = (actionCounts[code] || 0) + 1;
          actionCount++;
        }
      }
      totalActions += actionCount;

      // Count barriers (Q11 multi-code)
      for (const code of Object.keys(Q11_BARRIERS)) {
        if (d[code] === 1 || d[code] === "1") {
          barrierCounts[code] = (barrierCounts[code] || 0) + 1;
        }
      }

      // Count motivators (Q12 multi-code)
      for (const code of Object.keys(Q12_MOTIVATORS)) {
        if (d[code] === 1 || d[code] === "1") {
          motivatorCounts[code] = (motivatorCounts[code] || 0) + 1;
        }
      }
    }

    const n = matchedUuids.length;

    if (n < 5) {
      return NextResponse.json(
        { error: `Too few respondents (n=${n}). Broaden your filters.` },
        { status: 400 }
      );
    }

    // Compute averages
    const avgConcern = Math.round((totalConcern / n) * 100) / 100;
    const avgInfluence = Math.round((totalInfluence / n) * 100) / 100;
    const avgOptimism = Math.round((totalOptimism / n) * 100) / 100;
    const avgActions = Math.round((totalActions / n) * 10) / 10;

    // Build top-5 lists with percentages
    const toTop5 = (counts: Record<string, number>, codeMap: Record<string, string>) => {
      return Object.entries(counts)
        .map(([code, count]) => ({
          label: codeMap[code] || code,
          pct: Math.round((count / n) * 1000) / 10,
        }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 5);
    };

    const topActions = toTop5(actionCounts, Q9_ACTIONS);
    const topBarriers = toTop5(barrierCounts, Q11_BARRIERS);
    const topMotivators = toTop5(motivatorCounts, Q12_MOTIVATORS);

    // Sample 3 Q1 verbatims from matched respondents
    const verbatimCandidates = matchedUuids
      .map((uuid) => verbMap.get(uuid))
      .filter((v): v is string => v !== undefined && v.length > 20);

    // Deterministic sampling: pick evenly spaced verbatims
    const sampleVoices: string[] = [];
    if (verbatimCandidates.length > 0) {
      const step = Math.max(1, Math.floor(verbatimCandidates.length / 3));
      for (let i = 0; i < Math.min(3, verbatimCandidates.length); i++) {
        const idx = Math.min(i * step, verbatimCandidates.length - 1);
        sampleVoices.push(verbatimCandidates[idx]);
      }
    }

    // Build segment name from filters
    const filtersSummary = buildFiltersSummary(filters);
    const segmentName = filtersSummary === "All Respondents"
      ? "Custom Audience"
      : filtersSummary;

    // Build activation description from dominant segment
    const dominantSegId = Object.entries(segmentCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => Number(id))[0] || 3;
    const dominantSegName = getSegmentName(dominantSegId);
    const activationDescription = `Custom audience of ${n} respondents. Dominant segment: ${dominantSegName} (${Math.round((segmentCounts[dominantSegId] / n) * 100)}%).`;

    // Build the profile (without brief_text first, then add it)
    const profileBase = {
      segment_id: 0, // 0 = custom audience
      segment_name: segmentName,
      size: n,
      sharePct: Math.round((n / AUDIENCE_TOTAL_N) * 1000) / 10,
      avgConcern,
      avgInfluence,
      avgOptimism,
      avgActions,
      topActions,
      topBarriers,
      topMotivators,
      sampleVoices,
      activationDescription,
    };

    const briefText = buildSegmentBriefText(profileBase);

    const profile: CustomAudienceProfile = {
      ...profileBase,
      brief_text: briefText,
      filters,
      is_custom: true,
    };

    return NextResponse.json({ persona: profile });
  } catch (err) {
    console.error("Audience profile error:", err);
    return NextResponse.json(
      { error: "Failed to compute audience profile" },
      { status: 500 }
    );
  }
}
