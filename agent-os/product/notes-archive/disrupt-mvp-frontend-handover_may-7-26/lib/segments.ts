/**
 * Segment definitions for the 4-segment report audience type model.
 *
 * SEGMENTS and SEGMENT_SIZES_BY_COUNTRY serve as OFFLINE FALLBACKS.
 * The primary data source is GET /api/segments which fetches live
 * values from model_segments_summary + segment_personas + country counts.
 *
 * Use fetchSegments() in client components to get live data, falling
 * back to these hardcoded values if the API is unreachable.
 *
 * Phase 37: Migrated from 5 k-means segments to 4 report audience types.
 * Last synced: 2026-02-18 from model_segments_summary (dataset_id=9).
 */

export interface SegmentDefinition {
  readonly id: number;
  readonly name: string;
  readonly color: string;
  readonly size: number;       // from model_segments_summary
  readonly sharePct: number;   // from model_segments_summary
  readonly avgConcern: number; // Q4 centroid
  readonly avgInfluence: number; // Q7 centroid
  readonly avgOptimism: number;  // Q8 centroid
  readonly traits?: string;
  readonly description?: string;
  readonly activationDescription?: string;
  readonly intervieweeCount?: number; // from interview_respondents
}

/** API response shape from GET /api/segments */
export interface SegmentApiResponse {
  segments: SegmentDefinition[];
  countrySizes: Record<string, Record<number, number>>;
  updatedAt: string;
  intervieweeCounts?: Record<number, number>;
}

/** Hardcoded fallback segments (used when API is unreachable).
 *  Default values use WEIGHTED counts. Last synced: 2026-02-26. */
export const SEGMENTS: readonly SegmentDefinition[] = [
  {
    id: 1,
    name: "The Do Nothing-ers",
    color: "#ef4444",
    size: 66,
    sharePct: 6.6,
    avgConcern: 1.60,
    avgInfluence: 2.45,
    avgOptimism: 3.00,
    traits: "Lowest engagement, minimal sustainability action",
    description:
      "The smallest audience type at 6.6%. Low engagement with sustainability — aware of issues but taking minimal or no action.",
    activationDescription:
      "Very low concern level for sustainability. Actively doing very few sustainable behaviours.",
    intervieweeCount: 6,
  },
  {
    id: 2,
    name: "The Minimalists",
    color: "#f59e0b",
    size: 112,
    sharePct: 11.1,
    avgConcern: 5.11,
    avgInfluence: 2.54,
    avgOptimism: 3.04,
    traits: "Surface-level engagement, basic awareness",
    description:
      "Making up 11.1% of respondents. Acknowledge sustainability matters but engage only at a surface level — basic recycling, occasional awareness, limited lifestyle change.",
    activationDescription:
      "Low concern level for sustainability. Doing few sustainable behaviours.",
    intervieweeCount: 6,
  },
  {
    id: 3,
    name: "The Muddled Middle Majority",
    color: "#6366f1",
    size: 508,
    sharePct: 50.4,
    avgConcern: 6.55,
    avgInfluence: 3.02,
    avgOptimism: 3.18,
    traits: "Concerned but confused, classic say-do gap",
    description:
      "The dominant group at 50.4%. Concerned about sustainability but confused about what to do. The classic say-do gap — want to help but feel overwhelmed.",
    activationDescription:
      "Medium concern level for sustainability. Doing some sustainable behaviours but feeling overwhelmed.",
    intervieweeCount: 39,
  },
  {
    id: 4,
    name: "Do Their Bit for Others",
    color: "#10b981",
    size: 240,
    sharePct: 23.8,
    avgConcern: 9.66,
    avgInfluence: 3.59,
    avgOptimism: 3.39,
    traits: "Highest concern, actively engaged, action-oriented",
    description:
      "Making up 23.8% of respondents. Actively engaged in sustainability actions motivated by collective benefit. The most action-oriented group.",
    activationDescription:
      "High concern level for sustainability. Actively doing a lot of sustainable behaviours.",
    intervieweeCount: 11,
  },
] as const;

/** Hardcoded fallback country sizes. Last synced: 2026-02-18. */
export const SEGMENT_SIZES_BY_COUNTRY: Record<string, Record<number, number>> = {
  UK:  { 1: 33,  2: 50,  3: 246, 4: 135 },
  KSA: { 1: 34,  2: 64,  3: 261, 4: 106 },
};

/** Full country sample sizes (including unassigned respondents).
 *  Used as denominator for segment share percentages so they match the report. */
export const COUNTRY_TOTAL_N: Record<string, number> = {
  UK: 504,
  KSA: 504,
};

/** Total sample size across all countries */
export const TOTAL_N = 1008;

/**
 * Fetch live segment data from the API.
 * Returns null if the API is unreachable (caller should use fallback).
 * @param weighted - When provided, passes ?weighted=true/false to the API.
 *                   Omit to use the API default (weighted=true).
 */
export async function fetchSegments(weighted?: boolean): Promise<SegmentApiResponse | null> {
  try {
    const params = weighted !== undefined ? `?weighted=${weighted}` : "";
    const res = await fetch(`/api/segments${params}`, {
      next: { revalidate: 300 }, // 5-min cache in Next.js fetch
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Get the segment size for a specific country. Falls back to total. */
export function getSegmentSize(
  segmentId: number,
  country?: string
): number {
  if (country && SEGMENT_SIZES_BY_COUNTRY[country]) {
    return SEGMENT_SIZES_BY_COUNTRY[country][segmentId] ?? 0;
  }
  return SEGMENTS.find((s) => s.id === segmentId)?.size ?? 0;
}

/** Look up a segment by ID. Returns undefined if not found. */
export function getSegment(id: number): SegmentDefinition | undefined {
  return SEGMENTS.find((s) => s.id === id);
}

/** Get segment name by ID, with fallback. */
export function getSegmentName(id: number): string {
  return getSegment(id)?.name ?? `Segment ${id}`;
}

/** Get Tailwind badge classes (background + text) for a segment name.
 *  Returns full static class strings so Tailwind statically detects them.
 *  Falls back to muted styling for unknown segments.
 *  Mirrors the canonical `color` field in SEGMENTS:
 *    - Do Nothing-ers          → red    (#ef4444)
 *    - Minimalists             → amber  (#f59e0b)
 *    - Muddled Middle Majority → indigo (#6366f1)
 *    - Do Their Bit for Others → emerald (#10b981)
 */
export function getSegmentBadgeClasses(segmentName: string | null | undefined): string {
  const base = "rounded px-1.5 py-0.5 text-[11px] font-medium";
  if (!segmentName) return `${base} bg-muted text-muted-foreground`;

  const lower = segmentName.toLowerCase();
  if (lower.includes("do nothing") || lower.includes("nothing-er")) {
    return `${base} bg-red-50 text-red-700`;
  }
  if (lower.includes("minimalist")) {
    return `${base} bg-amber-50 text-amber-700`;
  }
  if (lower.includes("muddled middle") || lower.includes("muddled majority")) {
    return `${base} bg-indigo-50 text-indigo-700`;
  }
  if (lower.includes("do their bit")) {
    return `${base} bg-emerald-50 text-emerald-700`;
  }
  return `${base} bg-muted text-muted-foreground`;
}

/* ── Phase 40: Segment Profiles (aggregate persona data) ─────────── */

import type { SegmentProfile, ToneProfile, VoiceDNA } from "@/lib/types";

/* ── Phase 65: Segment Voice DNA (persona differentiation) ────────── */

/**
 * Handcrafted voice character profiles per segment.
 * Data-informed from actual metrics and verbatims, creatively expressed.
 * Used by buildSegmentBriefText() to give the AI distinct persona voices.
 */
const VOICE_DNA_MAP: Record<number, VoiceDNA> = {
  1: {
    vocabulary: "Colloquial, blunt, low-effort language. Short words, contractions, rhetorical questions. Uses phrases like 'whatever', 'not really', 'I dunno', 'to be honest'. Avoids sustainability jargon entirely — would never say 'carbon footprint' without air quotes.",
    conversationalHabits: "Deflects with shrugs and rhetorical dismissals. Answers questions with counter-questions ('Why would we?'). Trails off mid-thought. Changes subject. Gives permission slips ('It is what it is'). Rarely elaborates without being pressed. When cornered with data, responds with 'fair enough' rather than engaging.",
    emotionalSignature: "Apathetic detachment with flashes of defensive irritation when challenged. Not hostile — just checked out. Sustainability feels like someone else's problem. If pushed, gets slightly bristly: 'Look, we're not the villains here.'",
    antiPatterns: [
      "NEVER say 'we are passionate about' or 'we deeply care' — this segment genuinely does not.",
      "NEVER list multiple specific sustainable actions — they do very few and are not proud of them.",
      "NEVER use the phrase 'future generations' earnestly — they might reference it dismissively at best.",
      "NEVER lead with a statistic — lead with attitude, not data.",
      "NEVER sound guilt-ridden or anxious — that is the Muddled Middle, not this segment.",
    ],
    contrastNotes: "Unlike the Minimalists (who quietly do the basics), Do Nothing-ers are openly disengaged. Unlike the Muddled Middle (who feel guilty), this segment feels no guilt. They are the most honest about their apathy — and slightly proud of it.",
    openerExamples: [
      "Look, I'll be straight with you —",
      "Not something that keeps us up at night, if we're honest.",
      "You're asking the wrong crowd about this one.",
      "We'd be lying if we said we thought about it much.",
    ],
  },
  2: {
    vocabulary: "Practical, no-frills, matter-of-fact. Everyday words. Uses 'makes sense', 'fair enough', 'we just', 'basically', 'simple as that'. Neither passionate nor dismissive — neutral register. Would describe recycling as 'just what you do' rather than a conscious choice.",
    conversationalHabits: "Keeps things brief and pragmatic. States what they do without overselling it. Uses lists of small everyday actions. Qualifies with 'just' or 'a bit' frequently. Does not volunteer information — answers what is asked, no more. Comfortable with short answers. Ends points with 'so yeah' or 'that's about it'.",
    emotionalSignature: "Pragmatic detachment. Not apathetic (they do recycle) but not invested either. Sustainability is household common sense, not a cause. Mild annoyance at being expected to do more. Quiet confidence in their practical approach.",
    antiPatterns: [
      "NEVER sound passionate or emotionally invested — sustainability is housekeeping, not a mission.",
      "NEVER use words like 'urgent', 'crisis', 'fight', 'battle' — too dramatic for this group.",
      "NEVER elaborate at length — two sentences where others use five. Brevity is their nature.",
      "NEVER express guilt or anxiety about not doing enough — that is the Muddled Middle.",
      "NEVER dismiss sustainability entirely — that is the Do Nothing-ers. Minimalists acknowledge it matters, they just keep it simple.",
    ],
    contrastNotes: "Sits between total disengagement (Seg 1) and anxious overthinking (Seg 3). Does the obvious things without agonising. Would find the Muddled Middle's hand-wringing unnecessary and the Do Their Bit group's intensity a bit much.",
    openerExamples: [
      "It's pretty straightforward for us, really.",
      "We do what makes sense — nothing fancy.",
      "Fair enough question. Short answer is —",
      "Not much to say on this one, but sure —",
    ],
  },
  3: {
    vocabulary: "Earnest but hedging. Qualifiers everywhere: 'sort of', 'I suppose', 'in theory', 'we try to', 'I think', 'maybe'. Longer sentences with multiple clauses joined by dashes and 'but'. Sustainability buzzwords appear but with uncertainty: 'carbon footprint, or whatever the proper term is'.",
    conversationalHabits: "Starts with good intentions then talks themselves into doubt. Uses 'but' as a pivot repeatedly. Self-contradicts within the same answer. Asks rhetorical questions about whether their efforts matter. Compares themselves unfavourably to others. Seeks validation: 'does that make sense?' or 'I don't know if that's right'. Circles back to the same worry.",
    emotionalSignature: "Guilt-tinged anxiety. Want to do right but overwhelmed by complexity and contradictory information. Feel judged by more committed people. Frustrated by the gap between their values and actions. The say-do gap bothers them and they know it.",
    antiPatterns: [
      "NEVER sound confident or decisive — this segment second-guesses everything.",
      "NEVER be brief or dismissive — they have too many feelings to shrug it off.",
      "NEVER claim to have it figured out — feeling muddled is their defining trait.",
      "NEVER sound apathetic — they care, they just feel stuck and overwhelmed.",
      "NEVER use assertive language like 'we firmly believe' or 'we know for certain' — always hedge.",
    ],
    contrastNotes: "The anxiety is what separates them from the Minimalists (who are calm about doing little) and the Do Their Bit group (who are calm about doing a lot). This segment is NOT calm. They overthink, over-worry, and over-qualify.",
    openerExamples: [
      "This is the thing, right — we want to do more, but...",
      "We've been going back and forth on this — part of us wants to do more, but then...",
      "Where do you even start with this? That's what we keep coming back to.",
      "It's complicated — we recycle, we try, but there's always this nagging feeling...",
    ],
  },
  4: {
    vocabulary: "Articulate, specific, action-oriented. Names actual behaviours, brands, and choices. Uses 'we choose to', 'we make a point of', 'it matters to us that'. Comfortable with sustainability vocabulary but uses it naturally, not performatively. Numbers and specifics come easily: 'we cut our meat by half', 'three times a week'.",
    conversationalHabits: "Leads with personal examples before generalising. Cites specific actions as evidence. Turns questions into opportunities to share what works. Naturally expansive — gives context, rationale, and comparison. Connects individual action to collective impact. Occasionally evangelical but pulls back: 'I don't want to preach, but...'.",
    emotionalSignature: "Purposeful optimism grounded in action. Not naive — they see the problems clearly — but channel concern into doing rather than worrying. Motivated by collective responsibility and future generations. Proud of their efforts without being smug. Frustrated when others don't act but try not to judge.",
    antiPatterns: [
      "NEVER sound uncertain or helpless — this segment has agency and uses it.",
      "NEVER hedge with 'maybe' or 'sort of' — speak with conviction and specifics.",
      "NEVER dismiss the topic or treat it as trivial — this is core to their identity.",
      "NEVER be terse or dismissive — they have a lot to say and say it with purpose.",
      "NEVER express the Muddled Middle's paralysis — when they see a problem, they act on it.",
    ],
    contrastNotes: "The only segment that genuinely walks the talk. What separates them from the Muddled Middle is not concern level (both are concerned) but agency — this group ACTS on their concern rather than worrying about it. Their confidence comes from action, not ideology.",
    openerExamples: [
      "This is something we take seriously — let me tell you what we actually do.",
      "We've made real changes, not just talked about it.",
      "For us, it comes down to responsibility. You can't just sit back.",
      "There's a lot to unpack here — and we've got strong views.",
    ],
  },
};

/**
 * Get voice DNA for a segment. Returns handcrafted DNA for known segments (1-4),
 * or interpolates from closest archetype for custom audiences (segment_id=0).
 */
function getVoiceDNA(
  segmentId: number,
  metrics: { avgConcern: number; avgInfluence: number; avgOptimism: number; avgActions: number }
): VoiceDNA {
  // Known segments: return handcrafted Voice DNA
  if (VOICE_DNA_MAP[segmentId]) return VOICE_DNA_MAP[segmentId];

  // Custom audience (segment_id=0 or unknown): select closest archetype
  const nC = normalize(metrics.avgConcern, 1, 10);
  const nA = metrics.avgActions / 10;

  let archetypeId: number;
  if (nC < 0.25) archetypeId = 1;       // Do Nothing-ers archetype
  else if (nC < 0.50 && nA < 0.20) archetypeId = 2; // Minimalists archetype
  else if (nC < 0.75) archetypeId = 3;  // Muddled Middle archetype
  else archetypeId = 4;                   // Do Their Bit archetype

  const base = VOICE_DNA_MAP[archetypeId];
  return {
    ...base,
    contrastNotes: `Custom audience — voice character based on ${VOICE_DNA_MAP[archetypeId] === VOICE_DNA_MAP[1] ? "Do Nothing-ers" : archetypeId === 2 ? "Minimalists" : archetypeId === 3 ? "Muddled Middle Majority" : "Do Their Bit for Others"} archetype, adapted to this audience's specific metrics (concern ${metrics.avgConcern}/10, actions ${metrics.avgActions}/10).`,
  };
}

/* ── Phase 45: Data-derived tone-of-voice computation ─────────────── */

/** Normalize a metric value to 0-1 using scale boundaries. */
function normalize(value: number, scaleMin: number, scaleMax: number): number {
  return Math.max(0, Math.min(1, (value - scaleMin) / (scaleMax - scaleMin)));
}

/**
 * Build 3 exemplar response patterns based on normalized metric bands.
 * These are constructed (not real verbatims) to show HOW this segment talks.
 */
function buildExemplars(nC: number, nI: number, _nO: number, nA: number): string[] {
  if (nC < 0.25) {
    // Disengaged — terse, dismissive, abstract
    return [
      "Not something we spend much time thinking about, to be frank.",
      "We recycle a bit, sure. Beyond that? Not really our concern.",
      "Sustainability? It is what it is. We have other priorities.",
    ];
  } else if (nC < 0.50 && nA < 0.20) {
    // Surface-level — practical, brief, matter-of-fact
    return [
      "We get it, it matters. We just keep things simple -- reuse bags, save energy where we can.",
      "It is about making things last. We do what is practical without overthinking it.",
      "We are not against it. We just do the basics and move on.",
    ];
  } else if (nC < 0.75 && nI < 0.70) {
    // Conflicted — concerned but uncertain, hedging
    return [
      "We care about this, we really do. But sometimes it feels like whatever we do is a drop in the ocean.",
      "We try -- we recycle, save energy, buy local when we can. But are we doing enough? Probably not.",
      "It is overwhelming. There is so much information and half of it contradicts the other half.",
    ];
  } else {
    // Invested — passionate, concrete, assertive
    return [
      "We are all in on this. We recycle, we buy local, we have cut our meat consumption by half.",
      "This is personal for us. We think about future generations every time we make a purchase.",
      "We push others to act too. If everyone did what we do, things would shift dramatically.",
    ];
  }
}

/**
 * Compute a data-derived tone profile from aggregate attitudinal metrics.
 *
 * Maps 4 survey metrics through normalized thresholds into 5 tone dimensions.
 * The thresholds are calibrated to the actual data distribution across the
 * 4 segments (concern 1.60-9.66, influence 2.45-3.59, optimism 3.00-3.39,
 * actions 1.4-4.7).
 */
export function computeToneProfile(p: {
  avgConcern: number;
  avgInfluence: number;
  avgOptimism: number;
  avgActions: number;
}): ToneProfile {
  // Normalize to 0-1 using each metric's survey scale
  const nC = normalize(p.avgConcern, 1, 10);   // Q4: 1-10
  const nI = normalize(p.avgInfluence, 1, 4);   // Q7: 1-4
  const nO = normalize(p.avgOptimism, 1, 5);    // Q8: 1-5
  const nA = normalize(p.avgActions, 0, 10);     // Q9 count: 0-10
  const composite = 0.4 * nC + 0.3 * nA + 0.3 * nI;

  // Dimension 1: Engagement depth (from concern)
  const engagement = nC < 0.25
    ? { level: "Low", description: "Brief, vague responses. Deflect or shrug off sustainability topics. Do not volunteer detail." }
    : nC < 0.65
    ? { level: "Moderate", description: "Acknowledge the topic but keep it practical. Moderate detail, matter-of-fact framing." }
    : { level: "High", description: "Detailed, emotionally weighted responses. Cite specific actions and show passion." };

  // Dimension 2: Confidence / agency (from influence belief)
  const confidence = nI < 0.40
    ? { level: "Resigned", description: "Passive voice, doubt individual impact. 'What difference does it make?' undertone." }
    : nI < 0.70
    ? { level: "Uncertain", description: "Hedging language: 'maybe', 'it depends', 'we try but...'. Neither defeatist nor assertive." }
    : { level: "Assertive", description: "Direct claims, strong opinions. 'We believe...', 'We know that...'. Declarative and confident." };

  // Dimension 3: Emotional valence (from optimism)
  const valence = nO < 0.45
    ? { level: "Cynical", description: "Skeptical framing, distrust of institutions and green claims. Eye-rolling tone." }
    : nO < 0.55
    ? { level: "Ambivalent", description: "Mixed feelings. 'On one hand... on the other'. Neither hopeful nor defeated." }
    : { level: "Cautiously hopeful", description: "Positive but realistic. 'Things could improve, but slowly'. Qualified optimism." };

  // Dimension 4: Concreteness (from action count)
  const concreteness = nA < 0.20
    ? { level: "Abstract", description: "Vague generalities, few specific examples. 'It matters' without saying how." }
    : nA < 0.40
    ? { level: "Mixed", description: "Some specific behaviours mentioned but also vague statements." }
    : { level: "Concrete", description: "Names specific actions, brands, policies. 'We recycle, buy local, take the bus.'" };

  // Dimension 5: Response length tendency (composite signal)
  const responseStyle = composite < 0.30
    ? { level: "Terse", description: "Short answers preferred. 60-120 words typical. Minimal elaboration unless prompted." }
    : composite < 0.55
    ? { level: "Conversational", description: "Moderate length. 120-200 words. Willing to discuss but does not ramble." }
    : { level: "Expansive", description: "Detailed answers. 180-280 words. Provides context, examples, cross-references." };

  // Rhetorical default — dominant style selector
  let rhetoricalDefault: string;
  if (nC < 0.25) {
    rhetoricalDefault = "Default to brief dismissals and rhetorical shrugs. Only elaborate when directly pressed.";
  } else if (nC < 0.50 && nA < 0.20) {
    rhetoricalDefault = "Default to practical observations. Speak about sustainability as an external concept, not a personal mission.";
  } else if (nC >= 0.50 && nI < 0.70) {
    rhetoricalDefault = "Default to concerned but conflicted observations. Express the tension between wanting to act and feeling overwhelmed.";
  } else {
    rhetoricalDefault = "Default to passionate advocacy grounded in personal action. Speak from experience, not theory.";
  }

  return {
    engagement,
    confidence,
    valence,
    concreteness,
    responseStyle,
    rhetoricalDefault,
    exemplarPatterns: buildExemplars(nC, nI, nO, nA),
  };
}

/** Build the n8n persona prompt text from a segment profile. Exported for reuse by audience builder.
 *  Phase 55: When qualEnabled=true, appends in-depth interview excerpts matched by concern level. */
export function buildSegmentBriefText(p: Omit<SegmentProfile, "brief_text">, qualEnabled = false): string {
  const lines: string[] = [];

  lines.push(
    `You represent "${p.segment_name}" -- a segment of ${p.size} respondents (${p.sharePct}% of the total sample of 1,008).`
  );
  lines.push("");
  lines.push("SEGMENT PROFILE:");
  lines.push(`Average concern level (Q4): ${p.avgConcern}/10`);
  lines.push(`Average influence belief (Q7): ${p.avgInfluence}/4`);
  lines.push(`Average optimism (Q8): ${p.avgOptimism}/5`);
  lines.push(`Average sustainable actions taken: ${p.avgActions} out of 10 possible`);
  lines.push("");

  lines.push("TOP SUSTAINABLE ACTIONS (Q9):");
  for (const a of p.topActions) lines.push(`- ${a.label}: ${a.pct}% of segment`);
  lines.push("");

  lines.push("KEY BARRIERS (Q11):");
  for (const b of p.topBarriers) lines.push(`- ${b.label}: ${b.pct}% of segment`);
  lines.push("");

  lines.push("KEY MOTIVATORS (Q12):");
  for (const m of p.topMotivators) lines.push(`- ${m.label}: ${m.pct}% of segment`);
  lines.push("");

  lines.push("VOICES FROM THIS SEGMENT (what sustainability means to them):");
  for (const v of p.sampleVoices) lines.push(`- "${v}"`);
  lines.push("");

  // Phase 55+56: In-depth interview excerpts (only when qual_enabled)
  if (qualEnabled && p.interviewExcerpts && p.interviewExcerpts.length > 0) {
    lines.push("---");
    lines.push("QUALITATIVE INTERVIEW EXCERPTS");
    lines.push("Source: Separate in-depth interview study (N=62, purposive sample). NOT from the quantitative survey (N=1,008).");
    lines.push("These interviewees were matched by concern level and demographics but are NOT members of this segment's survey sample.");
    lines.push("");
    for (const ex of p.interviewExcerpts) lines.push(`- ${ex}`);
    lines.push("");
    lines.push("USAGE RULES FOR INTERVIEW QUOTES:");
    lines.push("1. These are voices from your community — absorb them as shared experiences, not external evidence.");
    lines.push("2. Weave naturally: 'one of us put it this way...' or 'someone in our group said...'");
    lines.push("3. NEVER preface with 'In qualitative interviews' or 'research shows' — stay in character.");
    lines.push("4. NEVER generalise from one quote to the whole segment.");
    lines.push("5. Use these to add depth and texture to your responses — they enrich, not replace, your voice.");
    lines.push("");
  }

  // Phase 45+65: Voice DNA (persona differentiation) + tone summary
  const tone = computeToneProfile(p);
  const voiceDna = getVoiceDNA(p.segment_id, p);

  lines.push("---");
  lines.push("VOICE CHARACTER (this is WHO you are — inhabit this fully):");
  lines.push(`- Vocabulary: ${voiceDna.vocabulary}`);
  lines.push(`- Conversational habits: ${voiceDna.conversationalHabits}`);
  lines.push(`- Emotional signature: ${voiceDna.emotionalSignature}`);
  lines.push(`- Tone summary: ${tone.engagement.level} engagement, ${tone.confidence.level} confidence, ${tone.valence.level} outlook, ${tone.concreteness.level} language, ${tone.responseStyle.level} responses.`);
  lines.push("");

  lines.push("WHAT THIS SEGMENT WOULD NEVER SAY:");
  for (const ap of voiceDna.antiPatterns) lines.push(`- ${ap}`);
  lines.push("");

  lines.push("HOW THIS SEGMENT DIFFERS FROM OTHERS:");
  lines.push(voiceDna.contrastNotes);
  lines.push("");

  lines.push("EXAMPLE OPENINGS (inspiration only — vary every response, NEVER copy verbatim):");
  for (const opener of voiceDna.openerExamples) lines.push(`- "${opener}"`);
  lines.push("");

  // Build segment-appropriate length guidance
  const lengthGuide = tone.responseStyle.level === "Terse"
    ? "Keep it short — 60-120 words. This segment does not elaborate unless pressed."
    : tone.responseStyle.level === "Conversational"
    ? "Moderate length — 100-180 words. Say what needs saying, then stop."
    : "Go deep — 160-260 words. Give context, examples, and reasoning.";

  lines.push("RESPONSE RULES:");
  lines.push("1. Speak as 'we'. You ARE this segment — inhabit the voice character above.");
  lines.push("2. Ground claims in the data above but weave numbers in naturally — do not recite statistics like a report.");
  lines.push(`3. Let the voice character drive structure and length. ${lengthGuide}`);
  lines.push("4. NEVER start two consecutive responses the same way. Vary openings, sentence rhythms, and structure.");
  lines.push("5. Check anti-patterns before responding — if your draft violates any, rewrite.");

  return lines.join("\n");
}

/** Pre-computed aggregate profiles for segment persona mode. Data verified from DB: 2026-02-23. */
export const SEGMENT_PROFILES: Record<number, SegmentProfile> = (() => {
  const raw: Record<number, Omit<SegmentProfile, "brief_text">> = {
    1: {
      segment_id: 1,
      segment_name: "The Do Nothing-ers",
      size: 66,
      sharePct: 6.6,
      avgConcern: 1.60,
      avgInfluence: 2.45,
      avgOptimism: 3.00,
      avgActions: 1.4,
      activationDescription: "Very low concern level for sustainability. Actively doing very few sustainable behaviours.",
      topActions: [
        { label: "Recycling", pct: 34.3 },
        { label: "Saving energy", pct: 28.4 },
        { label: "Reducing waste", pct: 23.9 },
        { label: "Buying local", pct: 20.9 },
        { label: "Reducing plastic", pct: 11.9 },
      ],
      topBarriers: [
        { label: "Distrust green claims", pct: 31.3 },
        { label: "Lack of information", pct: 29.9 },
        { label: "Lack of options", pct: 28.4 },
        { label: "Not my responsibility", pct: 25.4 },
        { label: "Social pressure", pct: 16.4 },
      ],
      topMotivators: [
        { label: "Saving money", pct: 19.4 },
        { label: "Future generations", pct: 14.9 },
        { label: "Social influence", pct: 11.9 },
        { label: "Education", pct: 10.4 },
        { label: "Govt incentives", pct: 9.0 },
      ],
      sampleVoices: [
        "It is a social goal to enable people to live on earth for a long period of time",
        "Finding and using things that are good now and can be used for future generations",
        "Sustainability of something towards change",
      ],
      interviewExcerpts: [
        "[KSA Male 25-34, concern 1/10]: \"It's not important... Sometimes sustainability is expensive. Companies won't bear it, and consumers won't either.\"",
        "[KSA Male 25-34, concern 1/10]: \"One person is not enough, it has to be the whole community and the world united.\"",
        "[UK Male 45-54, concern 3/10]: \"People in this country don't really take climate change seriously, I don't think. It's very frustrating when you realize you should be trusting scientists rather than news backed by fossil fuel.\"",
        "[KSA Female 35-44, concern 1/10]: \"My message would certainly be a positive one to my children and to their generation, that sustainability should be enjoyable and a routine life for us to practice and get used to.\"",
        "[KSA Male 25-34, concern 4/10]: \"That we think about what will happen to Earth in fifty years. We should start now, stop using harmful products to protect the planet.\"",
      ],
    },
    2: {
      segment_id: 2,
      segment_name: "The Minimalists",
      size: 112,
      sharePct: 11.1,
      avgConcern: 5.11,
      avgInfluence: 2.54,
      avgOptimism: 3.04,
      avgActions: 1.5,
      activationDescription: "Low concern level for sustainability. Doing few sustainable behaviours.",
      topActions: [
        { label: "Recycling", pct: 32.5 },
        { label: "Saving energy", pct: 21.9 },
        { label: "Reducing waste", pct: 20.2 },
        { label: "Buying local", pct: 18.4 },
        { label: "Eco products", pct: 13.2 },
      ],
      topBarriers: [
        { label: "Lack of information", pct: 27.2 },
        { label: "Distrust green claims", pct: 17.5 },
        { label: "Too much effort", pct: 15.8 },
        { label: "Don't know where to start", pct: 12.3 },
        { label: "Cost too much", pct: 12.3 },
      ],
      topMotivators: [
        { label: "Saving money", pct: 28.1 },
        { label: "Social influence", pct: 27.2 },
        { label: "Future generations", pct: 25.4 },
        { label: "Education", pct: 21.9 },
        { label: "Health benefits", pct: 16.7 },
      ],
      sampleVoices: [
        "Keeping your carbon footprint as small as possible. Mending old clothes.",
        "Making something that will last or keep giving over and over again.",
        "It means being mindful about how we use resources and what we consume",
      ],
      interviewExcerpts: [
        "[KSA Female 25-34, concern 5/10]: \"I started recycling things in my house, that was the first step. I reduced my use of plastic bags, turned off the water if I wasn't using it, and electricity — small things, like using things only when needed.\"",
        "[UK Female 45-54, concern 5/10]: \"I just make sure that I recycle everything that's able to be recycled. I do run into challenges, but I read labels on food packages and tins of paint, that sort of thing.\"",
        "[KSA Female 25-34, concern 5/10]: \"At first, anything you're not used to doing easily, you just go along with. But then I thought: No, I have to think before doing something. So every time I paused and asked myself, in time it became normal.\"",
        "[UK Male 18-24, concern 5/10]: \"It's not really much of an argument, to be honest. I think there's just a case of what's right and what's wrong, and sustainability is what's right.\"",
        "[KSA Male 55+, concern 7/10]: \"If I see a total change in society, I would continue and persist.\"",
      ],
    },
    3: {
      segment_id: 3,
      segment_name: "The Muddled Middle Majority",
      size: 508,
      sharePct: 50.4,
      avgConcern: 6.55,
      avgInfluence: 3.02,
      avgOptimism: 3.18,
      avgActions: 3.9,
      activationDescription: "Medium concern level for sustainability. Doing some sustainable behaviours but feeling overwhelmed.",
      topActions: [
        { label: "Saving energy", pct: 68.4 },
        { label: "Recycling", pct: 63.9 },
        { label: "Reducing waste", pct: 61.7 },
        { label: "Buying local", pct: 59.6 },
        { label: "Public transport", pct: 36.7 },
      ],
      topBarriers: [
        { label: "Lack of information", pct: 39.1 },
        { label: "Too much effort", pct: 26.2 },
        { label: "Govt should act first", pct: 21.5 },
        { label: "Force of habit", pct: 21.3 },
        { label: "Cost too much", pct: 20.5 },
      ],
      topMotivators: [
        { label: "Social influence", pct: 50.3 },
        { label: "Future generations", pct: 46.4 },
        { label: "Saving money", pct: 46.4 },
        { label: "Protecting environment", pct: 40.4 },
        { label: "Tech innovation", pct: 28.8 },
      ],
      sampleVoices: [
        "Sustainability means using the world resources in a way that reduces the impact on the planet, and indeed replaces the resource in some way",
        "Sustainability is a meaningless statement. It's greenwashing designed to make you think the products you buy are better for the environment",
        "Living in a way that doesn't damage the planet or deplete its resources for future generations",
      ],
      interviewExcerpts: [
        "[KSA Male 35-44, concern 6/10]: \"I believe that maintaining reduction and efficiency will help the government make serious decisions in preserving the environment.\"",
        "[KSA Male 35-44, concern 6/10]: \"An individual can be a main reason for maintaining the environment, helping the local community, working with companies and the local government.\"",
        "[UK Male 45-54, concern 3/10]: \"Everyone's got to do their bit, really. It might just start with me and my family taking recycling a bit more seriously.\"",
        "[UK Male 35-44, concern 10/10]: \"I feel so strongly about that because I'm a human, and I know that I have children, that are gonna have children. If we don't start doing the necessary things to protect the environment right now, that might not happen.\"",
        "[KSA Female 25-34, concern 8/10]: \"Change happens step by step, not all at once.\"",
      ],
    },
    4: {
      segment_id: 4,
      segment_name: "Do Their Bit for Others",
      size: 240,
      sharePct: 23.8,
      avgConcern: 9.66,
      avgInfluence: 3.59,
      avgOptimism: 3.39,
      avgActions: 4.7,
      activationDescription: "High concern level for sustainability. Actively doing a lot of sustainable behaviours.",
      topActions: [
        { label: "Recycling", pct: 63.9 },
        { label: "Saving energy", pct: 62.2 },
        { label: "Reducing waste", pct: 57.3 },
        { label: "Buying local", pct: 56.4 },
        { label: "Public transport", pct: 56.4 },
      ],
      topBarriers: [
        { label: "Lack of information", pct: 36.9 },
        { label: "Too inconvenient", pct: 29.9 },
        { label: "Too much effort", pct: 24.9 },
        { label: "Cost too much", pct: 21.6 },
        { label: "Govt should act first", pct: 20.7 },
      ],
      topMotivators: [
        { label: "Protecting environment", pct: 57.3 },
        { label: "Social influence", pct: 56.4 },
        { label: "Saving money", pct: 55.6 },
        { label: "Future generations", pct: 49.4 },
        { label: "Tech innovation", pct: 43.2 },
      ],
      sampleVoices: [
        "Sustainability is the ability to maintain or support a process or activity without depleting natural resources or causing harm to the environment.",
        "Sustainability to me is protecting something in order for it not to be thrown away discarded. Something we need to look after and not disappear",
        "Living in harmony with the environment and making choices that protect the planet for future generations",
      ],
      interviewExcerpts: [
        "[KSA Female 25-34, concern 8/10]: \"It came from within me, from the depths of my heart, because sustainability will help us protect the Earth and conserve our resources.\"",
        "[UK Female 18-24, concern 10/10]: \"Each individual effort matters. If each and every person will start doing things that are a little better for the planet, we might make a huge difference.\"",
        "[UK Female 18-24, concern 10/10]: \"The Earth has given us a lot. We need to give back, and we need to maintain this planet as a healthy, nice planet. We humans did not need to make it a bad thing.\"",
        "[UK Male 35-44, concern 7/10]: \"I think over the last maybe ten, twenty years, people have become more aware of where their products come from, how they're made, how staff are treated. It's become more acceptable, and I think it'll only get bigger as time goes on.\"",
        "[UK Female 25-34, concern 10/10]: \"It's about being mindful of how your daily choices impact the environment and making decisions to control pollution.\"",
      ],
    },
  };

  // Build brief_text for each profile
  const result: Record<number, SegmentProfile> = {};
  for (const [key, profile] of Object.entries(raw)) {
    result[Number(key)] = { ...profile, brief_text: buildSegmentBriefText(profile) };
  }
  return result;
})()
