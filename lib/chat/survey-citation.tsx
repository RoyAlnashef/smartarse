"use client"

/**
 * Inline `[3]` survey-verbatim citation chip.
 *
 * Ported from the Disrupt citation prototype
 * (`agent-os/product/notes-archive/disrupt-mvp-citation-handoff/components/CitationChip.tsx`).
 *
 * When the AI cites a survey verbatim inline, hover surfaces a tooltip with
 * the matched quote, question wording, segment badge, and respondent
 * demographics (country / gender / age). Falls back to the generic "Survey Data"
 * tooltip when no verbatim can be matched (figure-mode citations).
 */

import type { ReactNode } from "react"
import type { ChatCitationSource, ChatInlineCitation, SurveyChunkData } from "@/lib/types"
import {
  CitationSourceIcon,
  CitationTooltipBody,
  citationTooltipContentClass,
  citationTooltipContentStyle,
  resolveSurveyQuestionText,
} from "@/lib/chat/citation-tooltip"
import { CitationSourceTooltip } from "@/components/chat/citation-source-tooltip"
import { extractLastQuote, findVerbatimByContext } from "@/lib/citation-utils"
import {
  MOCK_SEGMENT_PERSONAS,
  type PersonaMock,
} from "@/lib/personas/segment-mocks"
import {
  resolveSegmentColorToken,
  segmentBadgeStyle,
} from "@/lib/personas/segment-color"
import { surveyQuestionText } from "@/lib/survey-codes"
import {
  citeSourceIndexBadgeCn,
  citeSourceIndexBadgeStyle,
} from "@/lib/theme/cite-color-tokens"
import { cn } from "@/lib/utils"

type SurveyCitationVariant = "default" | "compact"

const PRECEDING_TEXT_WINDOW = 200
const VERBATIM_QUOTE_CLAMP = 280

function clampText(value: string, max: number): string {
  if (value.length <= max) return value
  return value.slice(0, max).trimEnd() + "\u2026"
}

function cleanVerbatimQuote(verbatim: string): string {
  const englishIdx = verbatim.indexOf("[English]:")
  if (englishIdx >= 0) {
    return verbatim.slice(englishIdx + "[English]:".length).trim()
  }
  return verbatim.trim()
}

function VerbatimDemographicsRow({
  chunk,
  segmentPersonas,
  variant,
}: {
  chunk: SurveyChunkData
  segmentPersonas: PersonaMock[]
  variant: SurveyCitationVariant
}) {
  const demoTags = [chunk.country, chunk.gender_label, chunk.age_band].filter(
    (value): value is string => Boolean(value && value.trim())
  )
  const segmentColorToken = resolveSegmentColorToken(
    chunk.segment_name,
    segmentPersonas
  )
  const badgeStyle = segmentBadgeStyle(segmentColorToken)
  const sizeClass = variant === "compact" ? "text-[10px]" : "text-[11px]"

  if (!chunk.segment_name && demoTags.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
      {chunk.segment_name ? (
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-medium",
            sizeClass,
            badgeStyle ? null : "bg-muted text-muted-foreground"
          )}
          style={badgeStyle ?? undefined}
        >
          {chunk.segment_name}
        </span>
      ) : null}
      {demoTags.map((tag, idx) => (
        <span key={idx} className={cn("text-arse-black/65", sizeClass)}>
          {tag}
        </span>
      ))}
    </div>
  )
}

function SurveyVerbatimTooltipContent({
  source,
  variant,
  qCodeLabel,
  questionText,
  quoteText,
  demographicsChunk,
  demographicsUnavailable,
  segmentPersonas,
}: {
  source: ChatCitationSource
  variant: SurveyCitationVariant
  qCodeLabel: string | null
  questionText: string | null
  quoteText: string | null
  demographicsChunk: SurveyChunkData | null
  demographicsUnavailable?: boolean
  segmentPersonas: PersonaMock[]
}) {
  const isCompact = variant === "compact"
  const headingSuffix = qCodeLabel ? ` · ${qCodeLabel}` : ""
  const questionClass = cn(
    "italic leading-relaxed text-arse-black/60",
    isCompact ? "mt-2 text-[10px]" : "mt-3 text-[11px]"
  )
  const quoteClass = cn(
    "leading-relaxed text-arse-black/85",
    isCompact ? "mt-2 text-[11px]" : "mt-3 text-xs"
  )
  const footerMarginClass = isCompact ? "mt-2" : "mt-3"

  return (
    <>
      <div className="flex items-center gap-2 text-sm font-semibold leading-none">
        <CitationSourceIcon source={source} variant={variant} />
        <p className="leading-none">Survey verbatim{headingSuffix}</p>
      </div>
      {questionText ? <p className={questionClass}>{questionText}</p> : null}
      {quoteText ? (
        <p className={quoteClass}>&ldquo;{quoteText}&rdquo;</p>
      ) : null}
      {demographicsChunk ? (
        <div className={footerMarginClass}>
          <VerbatimDemographicsRow
            chunk={demographicsChunk}
            segmentPersonas={segmentPersonas}
            variant={variant}
          />
        </div>
      ) : null}
      {demographicsUnavailable ? (
        <p
          className={cn(
            "italic text-arse-black/55",
            isCompact ? "mt-2 text-[10px]" : "mt-3 text-[10px]"
          )}
        >
          Respondent demographics not available — verbatim outside current retrieval
          pool.
        </p>
      ) : null}
    </>
  )
}

function hasQuotePatternInPrecedingText(precedingText: string): boolean {
  const recentText = precedingText.slice(-250)
  return (
    /(>\s*["\u201c][^"\u201c\u201d\n]{15,})/.test(recentText) ||
    /["\u201c][^"\u201c\u201d\n]{15,}["\u201d]?\s*$/.test(recentText.trim())
  )
}

function dominantQuestionCodeFromPool(verbatims: SurveyChunkData[]): string | null {
  const counts: Record<string, number> = {}
  for (const row of verbatims) {
    if (!row.question_code) continue
    counts[row.question_code] = (counts[row.question_code] || 0) + 1
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return ranked.length > 0 ? ranked[0][0] : null
}

function renderSurveyCitationTooltip({
  source,
  variant,
  ariaLabel,
  segmentPersonas,
  inlineCitation,
  primaryLabel,
  children,
}: {
  source: ChatCitationSource
  variant: SurveyCitationVariant
  ariaLabel: string
  segmentPersonas: PersonaMock[]
  inlineCitation?: ChatInlineCitation | null
  primaryLabel: string
  children: ReactNode
}) {
  const button = (
    <button
      type="button"
      className={cn(
        citeSourceIndexBadgeCn(source.index, source.citeColorToken),
        "mx-0.5 align-middle transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink focus-visible:ring-offset-2"
      )}
      style={citeSourceIndexBadgeStyle(source.citeColorToken)}
      aria-label={ariaLabel}
    >
      {source.index}
    </button>
  )

  return (
    <CitationSourceTooltip
      trigger={button}
      className={citationTooltipContentClass(variant, source.citeColorToken, source)}
      style={citationTooltipContentStyle(source.citeColorToken)}
    >
      {children}
    </CitationSourceTooltip>
  )
}

/**
 * Inline `[3]` chip: verbatim popover when a quote can be matched against
 * `surveyChunks`, otherwise the generic "Survey Data" tooltip.
 */
export function InlineSurveyCitation({
  source,
  content,
  markerPosition,
  ariaLabel,
  primaryLabel,
  inlineCitation,
  segmentPersonas = MOCK_SEGMENT_PERSONAS,
  variant = "default",
}: {
  source: ChatCitationSource
  content: string
  markerPosition: number
  ariaLabel: string
  primaryLabel: string
  inlineCitation?: ChatInlineCitation | null
  segmentPersonas?: PersonaMock[]
  variant?: SurveyCitationVariant
}) {
  const verbatims = source.surveyChunks ?? []
  const precedingText =
    content && markerPosition > 0
      ? content.slice(
          Math.max(0, markerPosition - PRECEDING_TEXT_WINDOW),
          markerPosition
        )
      : ""

  const matched =
    precedingText && verbatims.length > 0
      ? findVerbatimByContext(verbatims, precedingText)
      : null

  if (matched) {
    const qCodeLabel =
      matched.question_code ?? source.questionCode ?? inlineCitation?.q_codes?.[0] ?? null
    const questionText =
      matched.question_text?.trim() ||
      (qCodeLabel
        ? resolveSurveyQuestionText(qCodeLabel, source, inlineCitation)
        : null)
    const rawQuote = matched.verbatim ? cleanVerbatimQuote(matched.verbatim) : null
    const quoteText = rawQuote ? clampText(rawQuote, VERBATIM_QUOTE_CLAMP) : null

    if (quoteText) {
      return renderSurveyCitationTooltip({
        source,
        variant,
        ariaLabel,
        segmentPersonas,
        inlineCitation,
        primaryLabel,
        children: (
          <SurveyVerbatimTooltipContent
            source={source}
            variant={variant}
            qCodeLabel={qCodeLabel}
            questionText={questionText || null}
            quoteText={quoteText}
            demographicsChunk={matched}
            segmentPersonas={segmentPersonas}
          />
        ),
      })
    }
  }

  if (verbatims.length > 0 && precedingText && hasQuotePatternInPrecedingText(precedingText)) {
    const fallbackQCode =
      dominantQuestionCodeFromPool(verbatims) ?? source.questionCode ?? null
    const fallbackQText = fallbackQCode
      ? surveyQuestionText(fallbackQCode) ||
        resolveSurveyQuestionText(fallbackQCode, source, inlineCitation)
      : null
    const aiQuote = extractLastQuote(precedingText)
    const previewQuote =
      aiQuote && aiQuote.length > VERBATIM_QUOTE_CLAMP
        ? clampText(aiQuote, VERBATIM_QUOTE_CLAMP)
        : aiQuote

    if (previewQuote) {
      return renderSurveyCitationTooltip({
        source,
        variant,
        ariaLabel,
        segmentPersonas,
        inlineCitation,
        primaryLabel,
        children: (
          <SurveyVerbatimTooltipContent
            source={source}
            variant={variant}
            qCodeLabel={fallbackQCode}
            questionText={fallbackQText || null}
            quoteText={previewQuote}
            demographicsChunk={null}
            demographicsUnavailable
            segmentPersonas={segmentPersonas}
          />
        ),
      })
    }
  }

  return (
    <CitationSourceTooltip
      trigger={
        <button
          type="button"
          className={cn(
            citeSourceIndexBadgeCn(source.index, source.citeColorToken),
            "mx-0.5 align-middle transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink focus-visible:ring-offset-2"
          )}
          style={citeSourceIndexBadgeStyle(source.citeColorToken)}
          aria-label={ariaLabel}
        >
          {source.index}
        </button>
      }
      className={citationTooltipContentClass(variant, source.citeColorToken, source)}
      style={citationTooltipContentStyle(source.citeColorToken)}
    >
      <CitationTooltipBody
        source={source}
        primaryLabel={primaryLabel}
        variant={variant}
        inlineCitation={inlineCitation}
        segmentPersonas={segmentPersonas}
      />
    </CitationSourceTooltip>
  )
}
