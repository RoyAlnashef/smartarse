import type { LucideIcon } from "lucide-react"
import type { CSSProperties } from "react"
import {
  BarChart3,
  ChartNoAxesColumn,
  Database,
  FileSpreadsheet,
  FileText,
  Globe,
  Table2,
} from "lucide-react"
import { isSurveyCitationSource } from "@/lib/documents/display-label"
import { sortSurveyQuestionCodesNumerically, surveyQuestionText } from "@/lib/survey-codes"
import type { ChatCitationSource, ChatInlineCitation } from "@/lib/types"
import { citeColorBorderStyle, citeColorTooltipBorderCn } from "@/lib/theme/cite-color-tokens"
import { lucideIconForCitationIconName } from "@/lib/theme/source-file-icons"
import { cn } from "@/lib/utils"

/** Shared with inline citations + `ChatCitationSourcesFooter` (client `ProjectChat`). */
export const CITATION_TOOLTIP_CONTENT_CLASS_DEFAULT =
  "w-fit max-w-[min(28rem,calc(100vw-5rem))] rounded-2xl border-2 bg-zinc-50 p-4 text-left text-arse-black shadow-[0_6px_18px_rgba(17,24,39,0.12)]"

/** Shared with inline citations + `ChatCitationSourcesFooter` (dashboard `ChatWindow`). */
export const CITATION_TOOLTIP_CONTENT_CLASS_COMPACT =
  "max-w-xs rounded-lg border-2 bg-white px-3 py-2 text-left text-xs text-arse-black"

type CitationTooltipVariant = "default" | "compact"

export function citationTooltipContentClass(
  variant: CitationTooltipVariant,
  citeColorToken: string | null | undefined,
  source?: ChatCitationSource | null
): string {
  return cn(
    variant === "compact"
      ? CITATION_TOOLTIP_CONTENT_CLASS_COMPACT
      : CITATION_TOOLTIP_CONTENT_CLASS_DEFAULT,
    variant === "default" && source && isSurveyCitationSource(source) ? "bg-white" : null,
    citeColorTooltipBorderCn(citeColorToken)
  )
}

export function citationTooltipContentStyle(
  citeColorToken: string | null | undefined
): CSSProperties {
  return citeColorBorderStyle(citeColorToken)
}

type CitationMetadataRow = {
  label: string
  value: string
}

function valueOrNull(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

/** User-facing label for the "Source type" tooltip row (payload may use terse enums). */
function citationSourceTypeMetadataValue(raw: string | null | undefined): string | null {
  const v = valueOrNull(raw)
  if (!v) return null
  if (v.toLowerCase() === "document") return "Written report"
  return v
}

function fileExtension(fileName: string | null): string | null {
  if (!fileName) return null
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/)
  return match ? match[1] : null
}

/**
 * Build metadata rows for non-survey citations. Survey sources render their
 * own Q-code list + sample pill in `CitationTooltipBody`, so this helper
 * deliberately returns `[]` for surveys to avoid duplicate "n=" / "Source type"
 * rows alongside the new list block (handover parity).
 *
 * Note: `questionCode` is intentionally omitted from the non-survey rows.
 * The AI-Agent occasionally tags document chunks with a Q-code (e.g. a report
 * paragraph that analyses Q4), but surfacing "Question code: Q4" alongside
 * "Source type: document" reads as noise without question prose to anchor it.
 */
export function buildCitationMetadataRows(source: ChatCitationSource): CitationMetadataRow[] {
  if (isSurveyCitationSource(source)) return []

  const rows: CitationMetadataRow[] = []
  const metadataCandidates: Array<[string, string | null]> = [
    ["Question", source.questionText],
    ["Respondents", source.respondentGroup],
    ["Sample size", source.sampleSize],
    ["Variables", source.variablesUsed],
    ["Source type", citationSourceTypeMetadataValue(source.sourceType)],
    ["Category", source.sourceCategory],
  ]

  for (const [label, rawValue] of metadataCandidates) {
    const value = valueOrNull(rawValue)
    if (value) rows.push({ label, value })
  }

  return rows
}

/**
 * Resolve the Q codes shown in the survey tooltip.
 *
 * Precedence (matches handover `SourceCardContent`):
 * 1. `inlineCitation.q_codes` (per-marker override) when non-empty
 * 2. `source.questionCodes` (full synthesis union) when non-empty
 * 3. single `[source.questionCode]` as a fallback list
 */
export function buildSurveyEffectiveQCodes(
  source: ChatCitationSource,
  inlineCitation?: ChatInlineCitation | null
): { codes: string[]; isOverride: boolean } {
  const override = inlineCitation?.q_codes ?? null
  if (override && override.length > 0) {
    const trimmed = sortSurveyQuestionCodesNumerically(
      override
        .map((c) => valueOrNull(c))
        .filter((c): c is string => c != null)
    )
    if (trimmed.length > 0) return { codes: trimmed, isOverride: true }
  }
  const union = source.questionCodes ?? null
  if (union && union.length > 0) {
    const trimmed = sortSurveyQuestionCodesNumerically(
      union
        .map((c) => valueOrNull(c))
        .filter((c): c is string => c != null)
    )
    if (trimmed.length > 0) return { codes: trimmed, isOverride: false }
  }
  const single = valueOrNull(source.questionCode)
  if (single) return { codes: [single], isOverride: false }
  return { codes: [], isOverride: false }
}

/**
 * Resolve survey question wording with hybrid fallback (handover semantics
 * extended for Phase 1 reality):
 *
 * 1. per-marker `inlineCitation.questionText` (when API supplies it)
 * 2. source-level `question_text` (when API supplies it and the source's
 *    primary `questionCode` matches `code`)
 * 3. static `Q_CODE_QUESTIONS` dictionary
 * 4. AI-supplied `chunk_topic` / `topic_label` (a topic label, not the
 *    question wording, but better than a bare code when (1)-(3) miss)
 * 5. empty string
 *
 * Step 4 is "wording-lite": the same topic suffix appears for every code
 * that shares the chunk, which can read redundant in a multi-Q list, but
 * gives single-code tooltips real context. Drop step 4 by deleting the
 * trailing branch if a populated `Q_CODE_QUESTIONS` makes it unnecessary.
 */
export function resolveSurveyQuestionText(
  code: string,
  source: ChatCitationSource,
  inlineCitation?: ChatInlineCitation | null
): string {
  const override = valueOrNull(inlineCitation?.questionText ?? null)
  if (override) return override
  const sourceCode = valueOrNull(source.questionCode)
  if (sourceCode && sourceCode === code) {
    const sourceText = valueOrNull(source.questionText)
    if (sourceText) return sourceText
  }
  const dictionary = surveyQuestionText(code)
  if (dictionary) return dictionary
  return valueOrNull(source.chunkTopic) ?? ""
}

/** Format a base/sample size value for the survey sample pill (`n=…`). */
function formatBaseSize(value: number | string | null | undefined): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString()
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return null
    const parsed = Number(trimmed.replace(/[,\s]/g, ""))
    if (Number.isFinite(parsed)) return parsed.toLocaleString()
    return trimmed
  }
  return null
}

/**
 * Build the sample-pill text (e.g. `All Respondents, n=1,008`).
 *
 * Always returns a non-empty string so the survey citation tooltip renders a
 * consistent sample pill, even when Disrupt omits sample metadata (typical for
 * multi-question synthesis rows). Falls back to "All Respondents" when no
 * description or `n` is available.
 */
export function buildSurveySamplePillText(source: ChatCitationSource): string {
  const description =
    valueOrNull(source.sampleDescription) ??
    valueOrNull(source.respondentGroup) ??
    "All Respondents"
  const n =
    formatBaseSize(source.baseSize) ??
    formatBaseSize(source.sampleSize)
  if (!n) return description
  return `${description}, n=${n}`
}

export function citationSourceIconHint(source: ChatCitationSource): string | null {
  return (
    valueOrNull(source.iconName) ??
    valueOrNull(source.iconType) ??
    valueOrNull(source.sourceType) ??
    valueOrNull(source.sourceCategory) ??
    valueOrNull(fileExtension(source.sourceFileName))
  )
}

function iconFromHint(hint: string): LucideIcon {
  const normalized = hint.trim().toLowerCase()
  if (normalized.includes("survey")) {
    return FileSpreadsheet
  }
  if (normalized.includes("question") || normalized.includes("table")) {
    return Table2
  }
  if (
    normalized.includes("chart") ||
    normalized.includes("metric") ||
    normalized.includes("graph")
  ) {
    return BarChart3
  }
  if (normalized.includes("spreadsheet") || normalized.includes("csv") || normalized.includes("xls")) {
    return FileSpreadsheet
  }
  if (normalized.includes("database") || normalized.includes("sql")) {
    return Database
  }
  if (normalized.includes("web") || normalized.includes("url") || normalized.includes("link")) {
    return Globe
  }
  if (normalized.includes("report") || normalized.includes("document") || normalized.includes("pdf")) {
    return FileText
  }
  return ChartNoAxesColumn
}

/** Tooltip title line for survey citations: `Survey Data (N=…)` when sample size is set. */
export function surveyCitationTooltipHeading(source: ChatCitationSource): string {
  const nRaw = valueOrNull(source.sampleSize)
  if (!nRaw) return "Survey Data"
  const stripped = nRaw.replace(/^n\s*=\s*/i, "").trim()
  const inner = stripped || nRaw
  return `Survey Data (N=${inner})`
}

export function CitationSourceIcon({
  source,
  variant = "default",
  className,
  strokeWidth = 2,
}: {
  source: ChatCitationSource
  variant?: CitationTooltipVariant
  className?: string
  strokeWidth?: number
}) {
  const iconUrl = valueOrNull(source.iconUrl)
  const iconFromAllowlistedKey = lucideIconForCitationIconName(source.iconName)
  const iconHint = citationSourceIconHint(source)
  const Icon =
    iconFromAllowlistedKey ??
    (iconHint ? iconFromHint(iconHint) : ChartNoAxesColumn)
  const sizeClass = variant === "compact" ? "h-3.5 w-3.5" : "h-4 w-4"
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        className={cn(sizeClass, "shrink-0 rounded-sm object-cover", className)}
        aria-hidden
      />
    )
  }
  return (
    <Icon
      className={cn(sizeClass, "shrink-0 text-arse-black/60", className)}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  )
}

function SurveyQuestionsBlock({
  source,
  inlineCitation,
  variant,
}: {
  source: ChatCitationSource
  inlineCitation?: ChatInlineCitation | null
  variant: CitationTooltipVariant
}) {
  const { codes, isOverride } = buildSurveyEffectiveQCodes(source, inlineCitation)
  if (codes.length === 0) return null

  const blockClass = cn(
    "rounded-md border border-arse-black/10 bg-arse-black/[0.04]",
    variant === "compact" ? "mt-2 px-2.5 py-1.5" : "mt-3 px-3 py-2"
  )
  const subtitleClass =
    "mb-1 text-[10px] font-medium uppercase tracking-wide text-arse-black/55"
  const codeLineClass = cn(
    "leading-relaxed text-arse-black/85",
    variant === "compact" ? "text-[11px]" : "text-xs"
  )

  if (codes.length > 1) {
    return (
      <div className={blockClass}>
        <p className={subtitleClass}>Survey Questions</p>
        <ul className="space-y-1">
          {codes.map((code) => (
            <li key={code} className={codeLineClass}>
              <span className="font-semibold text-arse-black">{code}.</span>{" "}
              {resolveSurveyQuestionText(code, source, inlineCitation)}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const code = codes[0]
  return (
    <div className={blockClass}>
      <p className={codeLineClass}>
        <span className="font-semibold text-arse-black">{code}.</span>{" "}
        {resolveSurveyQuestionText(code, source, inlineCitation)}
      </p>
    </div>
  )
}

function SurveySamplePill({
  source,
  variant,
}: {
  source: ChatCitationSource
  variant: CitationTooltipVariant
}) {
  const text = buildSurveySamplePillText(source)
  return (
    <span
      className={cn(
        "inline-block self-start rounded bg-arse-black/[0.06] font-mono text-arse-black/65",
        variant === "compact"
          ? "mt-2 px-1.5 py-0.5 text-[10px]"
          : "mt-3 px-2 py-0.5 text-[11px]"
      )}
    >
      {text}
    </span>
  )
}

export function CitationTooltipBody({
  source,
  primaryLabel,
  variant = "default",
  inlineCitation,
}: {
  source: ChatCitationSource
  primaryLabel: string
  variant?: CitationTooltipVariant
  /** Per-`[n]`-occurrence row resolved by the caller; narrows survey Q codes. */
  inlineCitation?: ChatInlineCitation | null
}) {
  const survey = isSurveyCitationSource(source)
  const metadataRows = buildCitationMetadataRows(source)
  const heading = survey ? surveyCitationTooltipHeading(source) : primaryLabel
  const excerptClass =
    variant === "compact"
      ? "mt-2 leading-relaxed text-arse-black/75"
      : "mt-3 rounded-xl border border-arse-black/10 bg-white p-3 text-sm font-medium leading-relaxed text-arse-black"

  return (
    <>
      <div className="flex items-center gap-2 text-sm font-semibold leading-none">
        <CitationSourceIcon source={source} variant={variant} />
        <p className="leading-none">{heading}</p>
      </div>
      {!survey && source.excerpt ? <p className={excerptClass}>{source.excerpt}</p> : null}
      {survey ? (
        <>
          <SurveyQuestionsBlock
            source={source}
            inlineCitation={inlineCitation}
            variant={variant}
          />
          <SurveySamplePill source={source} variant={variant} />
        </>
      ) : null}
      {metadataRows.length > 0 ? (
        <div className={variant === "compact" ? "mt-2 space-y-1" : "mt-3 space-y-1.5"}>
          {metadataRows.map((row, rowIndex) => (
            <p
              key={`${rowIndex}-${row.label}`}
              className={cn(
                "text-xs text-arse-black/70",
                row.label === "Question" && "break-words leading-relaxed"
              )}
            >
              <span className="font-semibold text-arse-black/85">{row.label}:</span>{" "}
              {row.label === "Question" ? (
                <span className="font-normal text-arse-black/80">{row.value}</span>
              ) : (
                row.value
              )}
            </p>
          ))}
        </div>
      ) : null}
      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer noopener"
          className={variant === "compact" ? "mt-2 inline-block underline decoration-arse-pink/70 underline-offset-2" : "mt-3 inline-block text-xs underline decoration-arse-pink/70 underline-offset-2"}
        >
          Open source
        </a>
      ) : null}
    </>
  )
}
