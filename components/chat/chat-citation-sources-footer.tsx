"use client"

import { useMemo } from "react"
import type { ChatCitationSource, ChatInlineCitation } from "@/lib/types"
import { buildFooterSurveySyntheticInlineCitation } from "@/lib/chat/inline-citations"
import { InterviewQuotesDialog } from "@/lib/chat/interview-citation"
import { filterCitedInterviewSources } from "@/lib/citation-utils"
import {
  citationSourcePrimaryLabel,
  isInterviewCitationSource,
  isSurveyCitationSource,
} from "@/lib/documents/display-label"
import {
  CitationSourceIcon,
  CitationTooltipBody,
  citationTooltipContentClass,
  citationTooltipContentStyle,
} from "@/lib/chat/citation-tooltip"
import type { PersonaMock } from "@/lib/personas/segment-mocks"
import {
  citeColorSubtleOuterChipCn,
  citeColorSubtleOuterChipStyle,
  citeSourceIndexBadgeCn,
  citeSourceIndexBadgeStyle,
} from "@/lib/theme/cite-color-tokens"
import { cn } from "@/lib/utils"
import { CitationSourceTooltip } from "@/components/chat/citation-source-tooltip"

export function ChatCitationSourcesFooter({
  sources,
  tooltipVariant,
  className,
  messageContent,
  inlineCitations,
  segmentPersonas,
}: {
  sources: ChatCitationSource[]
  tooltipVariant: "default" | "compact"
  className?: string
  /** Assistant markdown; used with `inlineCitations` to narrow survey footer Q codes. */
  messageContent?: string | null
  inlineCitations?: ChatInlineCitation[] | null
  /** Resolved persona list; drives segment-badge colors in the `[4]` quotes dialog. */
  segmentPersonas?: PersonaMock[]
}) {
  const filteredSources = useMemo(
    () =>
      filterCitedInterviewSources(
        messageContent ?? "",
        inlineCitations ?? null,
        sources
      ),
    [messageContent, inlineCitations, sources]
  )

  const footerSurveyInlineByIndex = useMemo(() => {
    const map = new Map<number, ChatInlineCitation>()
    for (const source of filteredSources) {
      if (!isSurveyCitationSource(source)) continue
      const synthetic = buildFooterSurveySyntheticInlineCitation(
        source.index,
        messageContent,
        inlineCitations
      )
      if (synthetic) map.set(source.index, synthetic)
    }
    return map
  }, [filteredSources, messageContent, inlineCitations])

  if (filteredSources.length === 0) return null

  const sorted = [...filteredSources].sort((a, b) => a.index - b.index)
  return (
    <div className={cn("mt-6 min-w-0 overflow-hidden border-t border-arse-black/10 pt-4", className)}>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-arse-black/55">Sources</span>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {sorted.map((source) => {
            const primaryLabel = citationSourcePrimaryLabel(source)
            const chipButton = (
              <button
                type="button"
                className={cn(
                  "flex max-w-full items-center gap-2 rounded-full border px-2 py-1.5 text-left font-arse-body text-xs font-semibold leading-snug text-arse-black shadow-sm transition-[filter] hover:brightness-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink focus-visible:ring-offset-2",
                  citeColorSubtleOuterChipCn(source.citeColorToken)
                )}
                style={citeColorSubtleOuterChipStyle(source.citeColorToken)}
                aria-label={`Citation ${source.index}: ${primaryLabel}`}
              >
                <span
                  className={citeSourceIndexBadgeCn(
                    source.index,
                    source.citeColorToken,
                    "row"
                  )}
                  style={citeSourceIndexBadgeStyle(source.citeColorToken)}
                >
                  {source.index}
                </span>
                <CitationSourceIcon source={source} variant={tooltipVariant} />
                <span className="min-w-0 truncate">{primaryLabel}</span>
              </button>
            )

            if (isInterviewCitationSource(source)) {
              return (
                <InterviewQuotesDialog
                  key={source.index}
                  source={source}
                  trigger={chipButton}
                  segmentPersonas={segmentPersonas}
                />
              )
            }

            return (
              <CitationSourceTooltip
                key={source.index}
                trigger={chipButton}
                className={citationTooltipContentClass(
                  tooltipVariant,
                  source.citeColorToken,
                  source
                )}
                style={citationTooltipContentStyle(source.citeColorToken)}
              >
                <CitationTooltipBody
                  source={source}
                  primaryLabel={primaryLabel}
                  variant={tooltipVariant}
                  inlineCitation={footerSurveyInlineByIndex.get(source.index)}
                  segmentPersonas={segmentPersonas}
                />
              </CitationSourceTooltip>
            )
          })}
        </div>
      </div>
    </div>
  )
}
