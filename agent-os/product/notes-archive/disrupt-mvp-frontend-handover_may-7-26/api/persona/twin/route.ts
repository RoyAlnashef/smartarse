import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { personaLimiter } from "@/lib/rate-limit";
import { getSegmentName } from "@/lib/segments";
import {
  Q2_ASSOCIATIONS,
  Q5_AREAS,
  Q5_UNDERSTANDING_SCALE,
  Q9_ACTIONS,
  Q11_BARRIERS,
  Q12_MOTIVATORS,
  Q13_STATEMENTS,
  Q14_STATEMENTS,
  Q16_INFO_SOURCES,
  Q17_RESPONSIBILITY,
  Q19_INFLUENCES,
  Q15_SCALES,
  Q6_ISSUES,
  Q7_SCALE,
  Q8_SCALE,
  Q10_SCALE,
  decodeMultiCode,
  decodeRankedMultiCode,
} from "@/lib/survey-codes";

/* ── Constants ─────────────────────────────────────────────────────── */

/** Verbatim question labels for the Digital Memory */
const VERBATIM_LABELS: Record<string, string> = {
  Q1: "What sustainability means to you",
  Q3: "What comes to mind about saving people and the planet",
  Q20: "A sustainability role model in your community",
  Q21: "Events that shaped your sustainability views",
  QC1: "A brand you associate with sustainability",
  QC2: "Product choice example",
  QC3: "Consumer experience",
  S5: "Occupation",
  Q11B: "Cultural/religious factors making sustainability harder",
  S4r98oe: "Location (other specify)",
  S6r98oe: "Ethnicity (other specify)",
  Q2r7oe: "Sustainability association (other specify)",
  Q6r17oe: "Important issue (other specify)",
  Q9r10oe: "Action taken (other specify)",
  Q11r13oe: "Barrier (other specify)",
  Q12r10oe: "Motivator (other specify)",
  Q16r11oe: "Information source (other specify)",
  Q19r9oe: "Adoption factor (other specify)",
};

/* ── Digital Memory Builder ────────────────────────────────────────── */

function buildDigitalMemory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: Record<string, any>,
  verbatims: { question_code: string; response_text: string }[]
): string {
  const lines: string[] = [];

  // ── Section A: Complete Survey Profile ──────────────────────────
  lines.push("COMPLETE SURVEY PROFILE:");
  lines.push("");

  // Demographics
  const age = profile.AGE_label || profile.AGE || "Unknown";
  const gender = profile.GENDER_label || (profile.GENDER === 1 ? "Male" : profile.GENDER === 2 ? "Female" : "Unknown");
  const country = profile.country_label || "Unknown";
  const occupation = profile.S5 || undefined;
  const jobStatus = profile.S1_label || undefined;
  const ethnicity = profile.Ethnicity_label || profile.Q24_label || undefined;
  const religion = profile.Q25_label || undefined;
  const area = profile.Q23_label || undefined;

  let demoLine = `Demographics: ${age}-year-old ${gender}, ${country}`;
  if (occupation) demoLine += `, ${occupation}`;
  if (jobStatus) demoLine += ` (${jobStatus})`;
  lines.push(demoLine);
  if (ethnicity) lines.push(`Ethnicity: ${ethnicity}`);
  if (religion) lines.push(`Religion: ${religion}`);
  if (area) lines.push(`Area type: ${area}`);
  if (profile.Q22_label) lines.push(`Industry: ${profile.Q22_label}`);
  lines.push("");

  // Concern & core attitudes
  lines.push("Concern & Attitudes:");
  lines.push(`- Concern Level (Q4): ${profile.Q4 || "?"}/10`);

  const q7 = Number(profile.Q7) || 0;
  const q8 = Number(profile.Q8) || 0;
  const q10 = Number(profile.Q10) || 0;
  lines.push(`- Individual Influence Belief (Q7): ${Q7_SCALE[q7] || q7 + "/6"}`);
  lines.push(`- Society's Ability (Q8): ${Q8_SCALE[q8] || q8 + "/5"}`);
  lines.push(`- Willingness to Change (Q10): ${Q10_SCALE[q10] || q10 + "/5"}`);

  // Q17: Primary responsibility (single select)
  const q17 = Number(profile.Q17) || 0;
  if (q17) {
    lines.push(`- Primary Responsibility for Sustainability (Q17): ${Q17_RESPONSIBILITY[q17] || profile.Q17_label || "Unknown"}`);
  }
  lines.push("");

  // Q5: Understanding areas (grid scale)
  const understandingLines: string[] = [];
  for (const [key, label] of Object.entries(Q5_AREAS)) {
    const val = Number(profile[key]) || 0;
    if (val > 0) {
      understandingLines.push(`  ${label}: ${Q5_UNDERSTANDING_SCALE[val] || val + "/5"}`);
    }
  }
  if (understandingLines.length > 0) {
    lines.push("Understanding of Sustainability Areas (Q5):");
    lines.push(...understandingLines);
    lines.push("");
  }

  // Multi-code fields
  const associations = decodeMultiCode(profile, Q2_ASSOCIATIONS);
  if (associations.length > 0) lines.push(`Sustainability Associations (Q2): ${associations.join(", ")}`);

  const actions = decodeMultiCode(profile, Q9_ACTIONS);
  if (actions.length > 0) lines.push(`Actions Taken (Q9): ${actions.join(", ")}`);

  const barriers = decodeMultiCode(profile, Q11_BARRIERS);
  if (barriers.length > 0) lines.push(`Barriers (Q11): ${barriers.join(", ")}`);

  const motivators = decodeMultiCode(profile, Q12_MOTIVATORS);
  if (motivators.length > 0) lines.push(`Motivators (Q12): ${motivators.join(", ")}`);

  const infoSources = decodeMultiCode(profile, Q16_INFO_SOURCES);
  if (infoSources.length > 0) lines.push(`Information Sources (Q16): ${infoSources.join(", ")}`);

  const adoptionFactors = decodeMultiCode(profile, Q19_INFLUENCES);
  if (adoptionFactors.length > 0) lines.push(`What Would Make You More Sustainable (Q19): ${adoptionFactors.join(", ")}`);

  // Q6: Important issues (ranked — values 1/2/3 indicate ranking position)
  const issues = decodeRankedMultiCode(profile, Q6_ISSUES);
  if (issues.length > 0) lines.push(`Most Important Sustainability Issues (Q6): ${issues.join(", ")}`);
  lines.push("");

  // Q13: Agreement statements (cell-encoded: Q13r1c1=Agree, c2=Disagree, c3=Don't know)
  const agreementLines: string[] = [];
  for (const [key, statement] of Object.entries(Q13_STATEMENTS)) {
    // Find which column (c1/c2/c3) is present for this row
    const c1 = profile[`${key}c1`];
    const c2 = profile[`${key}c2`];
    const c3 = profile[`${key}c3`];
    let answer = "Not answered";
    if (c1 !== undefined && c1 !== null && c1 !== "" && c1 !== 0 && c1 !== "0") answer = "Agree";
    else if (c2 !== undefined && c2 !== null && c2 !== "" && c2 !== 0 && c2 !== "0") answer = "Disagree";
    else if (c3 !== undefined && c3 !== null && c3 !== "" && c3 !== 0 && c3 !== "0") answer = "Don't know";
    agreementLines.push(`  "${statement}" → ${answer}`);
  }
  if (agreementLines.length > 0) {
    lines.push("Agreement Statements (Q13):");
    lines.push(...agreementLines);
    lines.push("");
  }

  // Q14: Business statements (cell-encoded, same pattern as Q13)
  const businessLines: string[] = [];
  for (const [key, statement] of Object.entries(Q14_STATEMENTS)) {
    const c1 = profile[`${key}c1`];
    const c2 = profile[`${key}c2`];
    const c3 = profile[`${key}c3`];
    let answer = "Not answered";
    if (c1 !== undefined && c1 !== null && c1 !== "" && c1 !== 0 && c1 !== "0") answer = "Agree";
    else if (c2 !== undefined && c2 !== null && c2 !== "" && c2 !== 0 && c2 !== "0") answer = "Disagree";
    else if (c3 !== undefined && c3 !== null && c3 !== "" && c3 !== 0 && c3 !== "0") answer = "Don't know";
    businessLines.push(`  "${statement}" → ${answer}`);
  }
  if (businessLines.length > 0) {
    lines.push("Business & Sustainability Views (Q14):");
    lines.push(...businessLines);
    lines.push("");
  }

  // Q15: Seriousness scales
  const seriousnessLines: string[] = [];
  for (const [key, label] of Object.entries(Q15_SCALES)) {
    const val = profile[key];
    if (val !== undefined && val !== null && val !== "") {
      seriousnessLines.push(`  ${label}: ${val}/10`);
    }
  }
  if (seriousnessLines.length > 0) {
    lines.push("How Seriously Sustainability is Taken (Q15):");
    lines.push(...seriousnessLines);
    lines.push("");
  }

  // ── Section B: Verbatim Responses ──────────────────────────────
  if (verbatims.length > 0) {
    lines.push("YOUR EXACT WORDS (VERBATIM RESPONSES):");
    lines.push("");
    for (const v of verbatims) {
      const label = VERBATIM_LABELS[v.question_code] || v.question_code;
      lines.push(`${label} (${v.question_code}):`);
      lines.push(`"${v.response_text}"`);
      lines.push("");
    }
  }

  // ── Section C: Behavioral Context ──────────────────────────────
  const segmentId = Number(profile.segment_id) || 0;
  lines.push("BEHAVIORAL CONTEXT:");
  lines.push(`- Verbatim richness score: ${profile.verbatim_richness || "N/A"}`);
  lines.push(`- Segment: ${getSegmentName(segmentId)} (Segment ${segmentId})`);
  lines.push(`- Country: ${country}`);

  return lines.join("\n");
}

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
    const { respondent_id } = body;

    if (
      !respondent_id ||
      typeof respondent_id !== "string" ||
      respondent_id.length < 8 ||
      respondent_id.length > 40 ||
      !/^[a-zA-Z0-9_-]+$/.test(respondent_id)
    ) {
      return NextResponse.json(
        { error: "Missing or invalid respondent_id" },
        { status: 400 }
      );
    }

    // 1. Fetch full respondent profile from tabular_document_rows
    const { data: rowData, error: rowError } = await supabase
      .from("tabular_document_rows")
      .select("id, row_data")
      .filter("row_data->data_rows->>uuid", "eq", respondent_id)
      .limit(1)
      .single();

    if (rowError || !rowData) {
      return NextResponse.json(
        { error: "Respondent not found" },
        { status: 404 }
      );
    }

    const profile = (
      rowData.row_data as Record<string, Record<string, unknown>>
    )?.data_rows;

    if (!profile) {
      return NextResponse.json(
        { error: "Invalid respondent data structure" },
        { status: 500 }
      );
    }

    // 2. Fetch all verbatim responses from v_open_ends
    const { data: verbatimData } = await supabase
      .from("v_open_ends")
      .select("question_code, response_text")
      .eq("respondent_uuid", respondent_id)
      .order("question_code");

    const verbatims = (verbatimData || []).filter(
      (v) => v.response_text && v.response_text.trim().length > 0
    );

    // 3. Build Digital Memory
    const digitalMemory = buildDigitalMemory(
      profile as Record<string, unknown>,
      verbatims
    );

    // Count meaningful variables (non-null, non-empty values in profile)
    const variableCount = Object.values(profile).filter(
      (v) => v !== null && v !== undefined && v !== ""
    ).length;

    return NextResponse.json({
      digital_memory: digitalMemory,
      verbatim_count: verbatims.length,
      variable_count: variableCount,
    });
  } catch (err) {
    console.error("Digital Twin fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Digital Twin data" },
      { status: 500 }
    );
  }
}
