import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/audience/filter-options
 * Returns distinct values for advanced audience builder filters.
 * Called once on component mount — values are static for this dataset.
 *
 * Phase 41a: Audience Builder
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

    // Fetch all assigned respondents (segments 1-4) with their demographic JSONB
    const { data: rows, error } = await supabase
      .from("tabular_document_rows")
      .select("row_data");

    if (error || !rows) {
      return NextResponse.json(
        { error: "Failed to fetch respondent data" },
        { status: 500 }
      );
    }

    // Collect distinct values from JSONB fields
    const ethnicitySet = new Set<string>();
    const religionSet = new Set<string>();
    const areaTypeSet = new Set<string>();
    const industrySet = new Set<string>();

    for (const row of rows) {
      const d = (row.row_data as Record<string, Record<string, unknown>>)?.data_rows;
      if (!d) continue;

      const ethnicity = d.Ethnicity_label as string | undefined;
      if (ethnicity && ethnicity.trim() && !ethnicity.startsWith("[")) {
        ethnicitySet.add(ethnicity.trim());
      }

      const religion = d.Q25_label as string | undefined;
      if (religion && religion.trim()) {
        religionSet.add(religion.trim());
      }

      const areaType = d.Q23_label as string | undefined;
      if (areaType && areaType.trim() && !areaType.startsWith("[")) {
        areaTypeSet.add(areaType.trim());
      }

      const industry = d.Q22_label as string | undefined;
      if (industry && industry.trim()) {
        industrySet.add(industry.trim());
      }
    }

    return NextResponse.json({
      ethnicities: [...ethnicitySet].sort(),
      religions: [...religionSet].sort(),
      area_types: [...areaTypeSet].sort(),
      industries: [...industrySet].sort(),
    });
  } catch (err) {
    console.error("Filter options error:", err);
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 }
    );
  }
}
