import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/segments?weighted=true
 *
 * Returns live segment data from the database:
 * - Segment definitions (id, name, size, share, centroids)
 * - Country breakdown (segment sizes per UK/KSA)
 *
 * Phase 36: Added `weighted` query parameter (default: true).
 * Cached for 5 minutes via Next.js revalidation.
 */
export const revalidate = 300; // 5-minute ISR cache

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Phase 36: Parse weighted param (default = true)
  const weighted = request.nextUrl.searchParams.get("weighted") !== "false";

  // 1. Fetch segment summary (key-value pivot), filtered by weighted flag
  const { data: summaryRows, error: summaryErr } = await supabase
    .from("model_segments_summary")
    .select("segment_id, metric_key, metric_value")
    .eq("dataset_id", 9)
    .eq("weighted", weighted)
    .gt("segment_id", 0); // Exclude Unassigned (segment_id=0)

  if (summaryErr) {
    return NextResponse.json(
      { error: "Failed to fetch segment summary" },
      { status: 500 }
    );
  }

  // 2. Fetch persona names
  const { data: personaRows, error: personaErr } = await supabase
    .from("segment_personas")
    .select("segment_id, persona_name")
    .eq("dataset_id", 9)
    .gt("segment_id", 0); // Exclude Unassigned

  if (personaErr) {
    return NextResponse.json(
      { error: "Failed to fetch segment personas" },
      { status: 500 }
    );
  }

  // 3. Fetch interviewee counts per segment
  const { data: interviewRows } = await supabase
    .from("interview_respondents")
    .select("segment_name");

  // 4. Fetch country breakdown via RPC (GROUP BY in Postgres)
  const { data: countryRows, error: countryErr } = await supabase
    .rpc("get_segment_country_counts");

  const countrySizes: Record<string, Record<number, number>> = {};

  if (!countryErr && countryRows) {
    for (const row of countryRows as Array<{
      segment_id: number;
      country: string;
      cnt: number;
    }>) {
      if (!countrySizes[row.country]) {
        countrySizes[row.country] = {};
      }
      countrySizes[row.country][row.segment_id] = Number(row.cnt);
    }
  }

  // 5. Build interviewee count map: segment_name (short) → count, then resolve to segment_id
  // interview_respondents.segment_name omits leading "The " for segments 1–3
  const interviewCountByName: Record<string, number> = {};
  for (const row of interviewRows || []) {
    if (row.segment_name) {
      interviewCountByName[row.segment_name] = (interviewCountByName[row.segment_name] || 0) + 1;
    }
  }

  // 6. Pivot summary rows into segment objects
  const nameMap: Record<number, string> = {};
  for (const p of personaRows || []) {
    nameMap[p.segment_id] = p.persona_name;
  }

  const metricsMap: Record<number, Record<string, string>> = {};
  for (const row of summaryRows || []) {
    if (!metricsMap[row.segment_id]) {
      metricsMap[row.segment_id] = {};
    }
    metricsMap[row.segment_id][row.metric_key] = row.metric_value;
  }

  // Stable segment color palette (Phase 37: 4 report audience types)
  const colors: Record<number, string> = {
    1: "#ef4444",  // Do Nothing-ers — red
    2: "#f59e0b",  // Minimalists — amber
    3: "#6366f1",  // Muddled Middle Majority — indigo
    4: "#10b981",  // Do Their Bit for Others — emerald
  };

  const segments = Object.entries(metricsMap)
    .map(([idStr, metrics]) => {
      const id = parseInt(idStr);
      const size = parseInt(metrics["segment_size"] || "0");
      const sharePct = parseFloat(metrics["segment_share_pct"] || "0");
      const avgConcern = parseFloat(metrics["avg_Q4"] || "0");
      const avgInfluence = parseFloat(metrics["avg_Q7"] || "0");
      const avgOptimism = parseFloat(metrics["avg_Q8"] || "0");

      // Match interviewee count: interview_respondents.segment_name omits leading "The " for segs 1–3
      // e.g. "The Do Nothing-ers".includes("Do Nothing-ers") → true
      const fullName = nameMap[id] || "";
      const intervieweeCount = Object.entries(interviewCountByName).reduce(
        (acc, [sname, cnt]) => (fullName.includes(sname) ? acc + cnt : acc),
        0
      );

      return {
        id,
        name: fullName || `Segment ${id}`,
        color: colors[id] || "#94a3b8",
        size,
        sharePct,
        avgConcern,
        avgInfluence,
        avgOptimism,
        intervieweeCount: intervieweeCount || undefined,
      };
    })
    .sort((a, b) => a.id - b.id);

  return NextResponse.json({
    segments,
    countrySizes,
    updatedAt: new Date().toISOString(),
  });
}
