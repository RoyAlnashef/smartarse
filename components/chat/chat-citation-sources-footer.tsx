"use client"

import { useMemo } from "react"
import type { ChatCitationSource, ChatInlineCitation } from "@/lib/types"
import { buildFooterSurveySyntheticInlineCitation } from "@/lib/chat/inline-citations"
import {
  citationSourcePrimaryLabel,
  isSurveyCitationSource,
} from "@/lib/documents/display-label"
import {
  CitationSourceIcon,
  CitationTooltipBody,
  citationTooltipContentClass,
  citationTooltipContentStyle,
} from "@/lib/chat/citation-tooltip"
import {
  citeColorSubtleOuterChipCn,
  citeColorSubtleOuterChipStyle,
  citeSourceIndexBadgeCn,
  citeSourceIndexBadgeStyle,
} from "@/lib/theme/cite-color-tokens"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ChatCitationSourcesFooter({
  sources,
  tooltipVariant,
  className,
  messageContent,
  inlineCitations,
}: {
  sources: ChatCitationSource[]
  tooltipVariant: "default" | "compact"
  className?: string
  /** Assistant markdown; used with `inlineCitations` to narrow survey footer Q codes. */
  messageContent?: string | null
  inlineCitations?: ChatInlineCitation[] | null
}) {
  if (sources.length === 0) return null

  const footerSurveyInlineByIndex = useMemo(() => {
    const map = new Map<number, ChatInlineCitation>()
    for (const source of sources) {
      if (!isSurveyCitationSource(source)) continue
      const synthetic = buildFooterSurveySyntheticInlineCitation(
        source.index,
        messageContent,
        inlineCitations
      )
      if (synthetic) map.set(source.index, synthetic)
    }
    return map
  }, [sources, messageContent, inlineCitations])

  const sorted = [...sources].sort((a, b) => a.index - b.index)
  return (
    <div className={cn("mt-6 border-t border-arse-black/10 pt-4", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="shrink-0 text-xs font-semibold text-arse-black/55">
          Sources
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {sorted.map((source) => {
            const primaryLabel = citationSourcePrimaryLabel(source)
            return (
              <Tooltip key={source.index}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex max-w-[min(18rem,calc(100vw-5rem))] items-center gap-2 rounded-full border px-2 py-1.5 text-left font-arse-body text-xs font-semibold leading-snug text-arse-black shadow-sm transition-[filter] hover:brightness-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink focus-visible:ring-offset-2",
                      citeColorSubtleOuterChipCn(source.citeColorToken)
                    )}
                    style={citeColorSubtleOuterChipStyle(source.citeColorToken)}
                    aria-label={`Citation ${source.index}: ${primaryLabel}`}
                  >
                    <span
                      className={citeSourceIndexBadgeCn(source.index, source.citeColorToken, "row")}
                      style={citeSourceIndexBadgeStyle(source.citeColorToken)}
                    >
                      {source.index}
                    </span>
                    <CitationSourceIcon source={source} variant={tooltipVariant} />
                    <span className="min-w-0 truncate">{primaryLabel}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className={citationTooltipContentClass(tooltipVariant, source.citeColorToken, source)}
                  style={citationTooltipContentStyle(source.citeColorToken)}
                >
                  <CitationTooltipBody
                    source={source}
                    primaryLabel={primaryLabel}
                    variant={tooltipVariant}
                    inlineCitation={footerSurveyInlineByIndex.get(source.index)}
                  />
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </div>
  )
}
