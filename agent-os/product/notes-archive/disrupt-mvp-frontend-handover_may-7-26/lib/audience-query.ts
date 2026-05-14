/**
 * Shared SQL query builder for audience filtering.
 * Used by /api/audience/preview, /api/audience/profile, and /api/audience/respondents.
 *
 * Phase 41a: Audience Builder
 */

import type { AudienceFilters } from "@/lib/types";

/** JSONB field paths in tabular_document_rows.row_data->'data_rows' */
const FIELD = {
  uuid: "t.row_data->'data_rows'->>'uuid'",
  country: "t.row_data->'data_rows'->>'country_label'",
  gender: "t.row_data->'data_rows'->>'GENDER_label'",
  age: "(t.row_data->'data_rows'->>'AGE_label')::int",
  concern: "(t.row_data->'data_rows'->>'Q4')::numeric",
  ethnicity: "t.row_data->'data_rows'->>'Ethnicity_label'",
  religion: "t.row_data->'data_rows'->>'Q25_label'",
  area_type: "t.row_data->'data_rows'->>'Q23_label'",
  industry: "t.row_data->'data_rows'->>'Q22_label'",
} as const;

/**
 * Build a parameterized WHERE clause from AudienceFilters.
 * Returns the WHERE conditions (without "WHERE" keyword) and the parameter values.
 * Always includes: segment_id > 0 (exclude unassigned) and dataset_id = 9.
 */
export function buildAudienceWhere(filters: AudienceFilters): {
  conditions: string;
  params: unknown[];
} {
  const clauses: string[] = [
    "m.dataset_id = 9",
    "m.segment_id > 0",
  ];
  const params: unknown[] = [];
  let idx = 1;

  // Segment filter
  if (filters.segment_ids.length > 0) {
    const placeholders = filters.segment_ids.map(() => `$${idx++}`);
    clauses.push(`m.segment_id IN (${placeholders.join(",")})`);
    params.push(...filters.segment_ids);
  }

  // Country filter
  if (filters.countries.length > 0) {
    const placeholders = filters.countries.map(() => `$${idx++}`);
    clauses.push(`${FIELD.country} IN (${placeholders.join(",")})`);
    params.push(...filters.countries);
  }

  // Gender filter
  if (filters.genders.length > 0) {
    const placeholders = filters.genders.map(() => `$${idx++}`);
    clauses.push(`${FIELD.gender} IN (${placeholders.join(",")})`);
    params.push(...filters.genders);
  }

  // Age range
  if (filters.age_min !== undefined && filters.age_min !== null) {
    clauses.push(`${FIELD.age} >= $${idx++}`);
    params.push(filters.age_min);
  }
  if (filters.age_max !== undefined && filters.age_max !== null) {
    clauses.push(`${FIELD.age} <= $${idx++}`);
    params.push(filters.age_max);
  }

  // Concern range
  if (filters.concern_min !== undefined && filters.concern_min !== null) {
    clauses.push(`${FIELD.concern} >= $${idx++}`);
    params.push(filters.concern_min);
  }
  if (filters.concern_max !== undefined && filters.concern_max !== null) {
    clauses.push(`${FIELD.concern} <= $${idx++}`);
    params.push(filters.concern_max);
  }

  // Advanced filters
  if (filters.ethnicities.length > 0) {
    const placeholders = filters.ethnicities.map(() => `$${idx++}`);
    clauses.push(`${FIELD.ethnicity} IN (${placeholders.join(",")})`);
    params.push(...filters.ethnicities);
  }

  if (filters.religions.length > 0) {
    const placeholders = filters.religions.map(() => `$${idx++}`);
    clauses.push(`${FIELD.religion} IN (${placeholders.join(",")})`);
    params.push(...filters.religions);
  }

  if (filters.area_types.length > 0) {
    const placeholders = filters.area_types.map(() => `$${idx++}`);
    clauses.push(`${FIELD.area_type} IN (${placeholders.join(",")})`);
    params.push(...filters.area_types);
  }

  if (filters.industries.length > 0) {
    const placeholders = filters.industries.map(() => `$${idx++}`);
    clauses.push(`${FIELD.industry} IN (${placeholders.join(",")})`);
    params.push(...filters.industries);
  }

  return {
    conditions: clauses.join(" AND "),
    params,
  };
}

/** Validate and sanitize incoming AudienceFilters from request body */
export function parseFilters(body: Record<string, unknown>): AudienceFilters {
  return {
    segment_ids: Array.isArray(body.segment_ids)
      ? (body.segment_ids as number[]).filter((v) => [1, 2, 3, 4].includes(v))
      : [],
    countries: Array.isArray(body.countries)
      ? (body.countries as string[]).filter((v) => ["UK", "KSA"].includes(v))
      : [],
    genders: Array.isArray(body.genders)
      ? (body.genders as string[]).filter((v) => typeof v === "string" && v.length < 50)
      : [],
    age_min: typeof body.age_min === "number" && body.age_min >= 18 && body.age_min <= 75
      ? body.age_min
      : undefined,
    age_max: typeof body.age_max === "number" && body.age_max >= 18 && body.age_max <= 75
      ? body.age_max
      : undefined,
    concern_min: typeof body.concern_min === "number" && body.concern_min >= 1 && body.concern_min <= 10
      ? body.concern_min
      : undefined,
    concern_max: typeof body.concern_max === "number" && body.concern_max >= 1 && body.concern_max <= 10
      ? body.concern_max
      : undefined,
    ethnicities: Array.isArray(body.ethnicities)
      ? (body.ethnicities as string[]).filter((v) => typeof v === "string" && v.length < 100)
      : [],
    religions: Array.isArray(body.religions)
      ? (body.religions as string[]).filter((v) => typeof v === "string" && v.length < 200)
      : [],
    area_types: Array.isArray(body.area_types)
      ? (body.area_types as string[]).filter((v) => typeof v === "string" && v.length < 100)
      : [],
    industries: Array.isArray(body.industries)
      ? (body.industries as string[]).filter((v) => typeof v === "string" && v.length < 100)
      : [],
  };
}

/** Build a human-readable summary of active filters */
export function buildFiltersSummary(filters: AudienceFilters): string {
  const parts: string[] = [];

  if (filters.countries.length > 0 && filters.countries.length < 2) {
    parts.push(filters.countries.join(" & "));
  }

  if (filters.genders.length > 0 && filters.genders.length < 3) {
    parts.push(filters.genders.join(" & "));
  }

  if (filters.age_min !== undefined || filters.age_max !== undefined) {
    const min = filters.age_min ?? 18;
    const max = filters.age_max ?? 75;
    parts.push(`Age ${min}-${max}`);
  }

  if (filters.concern_min !== undefined || filters.concern_max !== undefined) {
    const min = filters.concern_min ?? 1;
    const max = filters.concern_max ?? 10;
    parts.push(`Concern ${min}-${max}`);
  }

  if (filters.segment_ids.length > 0 && filters.segment_ids.length < 4) {
    parts.push(`Seg ${filters.segment_ids.join("+")}`);
  }

  if (filters.ethnicities.length > 0) {
    parts.push(filters.ethnicities.length === 1 ? filters.ethnicities[0] : `${filters.ethnicities.length} ethnicities`);
  }

  if (filters.religions.length > 0) {
    parts.push(filters.religions.length === 1 ? filters.religions[0] : `${filters.religions.length} religions`);
  }

  if (filters.area_types.length > 0) {
    parts.push(filters.area_types.length === 1 ? filters.area_types[0] : `${filters.area_types.length} areas`);
  }

  if (filters.industries.length > 0) {
    parts.push(filters.industries.length === 1 ? filters.industries[0] : `${filters.industries.length} industries`);
  }

  return parts.length > 0 ? parts.join(" · ") : "All Respondents";
}

/** Total sample size (excluding unassigned segment 0) */
export const AUDIENCE_TOTAL_N = 929; // 1008 - 79 unassigned

/* ── Phase 44c: Proactive Insight computation ────────────────────────── */

import type { AudienceInsight } from "@/lib/types";

interface MetricStats {
  avgConcern: number;
  avgInfluence: number;
  avgOptimism: number;
  avgActions: number;
}

interface PopulationBaselines extends MetricStats {
  stdConcern: number;
  stdInfluence: number;
  stdOptimism: number;
  stdActions: number;
}

/**
 * Compute population-wide baselines (mean + stddev) from all assigned respondents.
 * Called once during preview — the full population data is already in memory.
 */
export function computePopulationBaselines(
  values: { concern: number; influence: number; optimism: number; actions: number }[]
): PopulationBaselines {
  const n = values.length;
  if (n === 0) {
    return {
      avgConcern: 0, avgInfluence: 0, avgOptimism: 0, avgActions: 0,
      stdConcern: 1, stdInfluence: 1, stdOptimism: 1, stdActions: 1,
    };
  }

  let sumC = 0, sumI = 0, sumO = 0, sumA = 0;
  for (const v of values) {
    sumC += v.concern;
    sumI += v.influence;
    sumO += v.optimism;
    sumA += v.actions;
  }
  const avgC = sumC / n;
  const avgI = sumI / n;
  const avgO = sumO / n;
  const avgA = sumA / n;

  let varC = 0, varI = 0, varO = 0, varA = 0;
  for (const v of values) {
    varC += (v.concern - avgC) ** 2;
    varI += (v.influence - avgI) ** 2;
    varO += (v.optimism - avgO) ** 2;
    varA += (v.actions - avgA) ** 2;
  }

  return {
    avgConcern: avgC, avgInfluence: avgI, avgOptimism: avgO, avgActions: avgA,
    stdConcern: Math.sqrt(varC / n) || 1,
    stdInfluence: Math.sqrt(varI / n) || 1,
    stdOptimism: Math.sqrt(varO / n) || 1,
    stdActions: Math.sqrt(varA / n) || 1,
  };
}

/** Build a human-readable interpretation line */
function buildInterpretation(
  label: string,
  audienceVal: number,
  popVal: number,
  scale: string,
  direction: "above" | "below",
  deltaPct: number
): string {
  const av = audienceVal.toFixed(1);
  const pv = popVal.toFixed(1);
  const absDelta = Math.abs(deltaPct).toFixed(0);
  const dirWord = direction === "above" ? "higher" : "lower";
  return `This audience's ${label.toLowerCase()} (${av}${scale}) is ${absDelta}% ${dirWord} than the population average (${pv}${scale})`;
}

/**
 * Compare audience metrics against population baselines.
 * Returns insights for metrics where |z-score| > 1 or |relative delta| > 20%.
 */
export function computeInsights(
  audience: MetricStats,
  pop: PopulationBaselines
): AudienceInsight[] {
  const insights: AudienceInsight[] = [];
  let counter = 0;

  const metrics: {
    key: keyof MetricStats;
    label: string;
    scale: string;
    popAvg: number;
    popStd: number;
  }[] = [
    { key: "avgConcern", label: "Concern Level", scale: "/10", popAvg: pop.avgConcern, popStd: pop.stdConcern },
    { key: "avgInfluence", label: "Perceived Influence", scale: "/4", popAvg: pop.avgInfluence, popStd: pop.stdInfluence },
    { key: "avgOptimism", label: "Optimism", scale: "/5", popAvg: pop.avgOptimism, popStd: pop.stdOptimism },
    { key: "avgActions", label: "Actions Taken", scale: "/10", popAvg: pop.avgActions, popStd: pop.stdActions },
  ];

  for (const m of metrics) {
    const aVal = audience[m.key];
    const diff = aVal - m.popAvg;
    const zScore = diff / m.popStd;
    const relativeDelta = m.popAvg !== 0 ? (diff / m.popAvg) * 100 : 0;

    // Flag if |z-score| > 1 OR |relative delta| > 20%
    if (Math.abs(zScore) > 1 || Math.abs(relativeDelta) > 20) {
      const direction: "above" | "below" = diff >= 0 ? "above" : "below";
      const significance: "high" | "medium" = Math.abs(zScore) > 1.5 ? "high" : "medium";

      insights.push({
        id: `insight-${counter++}`,
        metric_label: m.label,
        audience_value: Math.round(aVal * 100) / 100,
        population_value: Math.round(m.popAvg * 100) / 100,
        delta_relative_pct: Math.round(relativeDelta * 10) / 10,
        direction,
        significance,
        interpretation: buildInterpretation(m.label, aVal, m.popAvg, m.scale, direction, relativeDelta),
      });
    }
  }

  return insights;
}
