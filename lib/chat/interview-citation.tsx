"use client"

/**
 * Inline `[4]` interview-citation chip + aggregated quotes dialog.
 *
 * Ported and re-skinned from the Disrupt citation prototype
 * (`agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/CitationChip.tsx`).
 *
 * Trigger semantics intentionally mirror the rest of the citation system:
 * **hover surfaces a tooltip, click opens a dialog.** That keeps `[4]` parity
 * with `[1]`/`[2]`/`[3]` and prevents users from having to learn a different
 * interaction for one citation type.
 *
 * - {@link InlineInterviewCitation}: hover-Tooltip for an inline `[4]` pill
 *   that shows the specific interview chunk matched against the preceding
 *   sentence. Falls back to {@link InterviewQuotesDialog} (click) when no
 *   chunk can be matched (e.g. AI placed a single `[4]` at the end of a
 *   header that summarises multiple quotes below it).
 *
 * - {@link InterviewQuotesDialog}: click-Dialog that aggregates every cited
 *   interview chunk on the source. Triggered from both the inline fallback
 *   and the footer `[4]` chip.
 *
 * Other citation indices ([1]/[2]/[3]) continue to use the existing hover
 * Tooltip path in `message-bubble.tsx` / `project-chat.tsx` /
 * `chat-citation-sources-footer.tsx`.
 */

import { MessageSquareQuote, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import type { ChatCitationSource, InterviewChunkData } from "@/lib/types"
import {
  citationTooltipContentClass,
  citationTooltipContentStyle,
} from "@/lib/chat/citation-tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { findChunkByContext } from "@/lib/citation-utils"
import {
  MOCK_SEGMENT_PERSONAS,
  type PersonaMock,
} from "@/lib/personas/segment-mocks"
import {
  resolveSegmentColorToken,
  segmentBadgeStyle,
} from "@/lib/personas/segment-color"
import {
  citeColorBorderStyle,
  citeSourceIndexBadgeCn,
  citeSourceIndexBadgeStyle,
} from "@/lib/theme/cite-color-tokens"
import { lucideIconForCitationIconName } from "@/lib/theme/source-file-icons"
import { cn } from "@/lib/utils"

type InterviewCitationVariant = "default" | "compact"

/**
 * Resolve the header icon for the popover/dialog. Honors the admin's
 * `sourceIconKey` (plumbed onto `source.iconName` by
 * `mergeCitationSourcesWithDocIcons`) and falls back to `MessageSquareQuote`
 * so legacy interview citations without an icon key still render sensibly.
 */
function resolveInterviewHeaderIcon(source: ChatCitationSource): LucideIcon {
  return lucideIconForCitationIconName(source.iconName) ?? MessageSquareQuote
}

const PRECEDING_TEXT_WINDOW = 200
const CHUNK_PREVIEW_CLAMP = 320
const MODERATOR_QUESTION_MIN_LEN = 20

function clampText(value: string, max: number): string {
  if (value.length <= max) return value
  return value.slice(0, max).trimEnd() + "\u2026"
}

function ChunkDemographicsRow({
  chunk,
  segmentColorToken,
}: {
  chunk: InterviewChunkData
  segmentColorToken: string | null
}) {
  const tags = [
    chunk.interview_country,
    chunk.interview_gender,
    chunk.interview_age,
  ].filter((value): value is string => Boolean(value && value.trim()))

  if (!chunk.interview_segment && tags.length === 0) return null

  const badgeStyle = segmentBadgeStyle(segmentColorToken)

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
      {chunk.interview_segment ? (
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[11px] font-medium",
            badgeStyle ? null : "bg-muted text-muted-foreground"
          )}
          style={badgeStyle}
        >
          {chunk.interview_segment}
        </span>
      ) : null}
      {tags.map((tag, idx) => (
        <span key={idx} className="text-[11px] text-muted-foreground">
          {tag}
        </span>
      ))}
    </div>
  )
}

function ChunkListItem({
  chunk,
  segmentPersonas,
}: {
  chunk: InterviewChunkData
  segmentPersonas: PersonaMock[]
}) {
  const moderatorQuestion = chunk.moderator_question?.trim() ?? ""
  const showModeratorQuestion =
    moderatorQuestion.length >= MODERATOR_QUESTION_MIN_LEN
  const chunkPreview = chunk.chunk_preview?.trim() ?? ""
  const segmentColorToken = resolveSegmentColorToken(
    chunk.interview_segment,
    segmentPersonas
  )

  return (
    <div className="space-y-2 py-4">
      <ChunkDemographicsRow
        chunk={chunk}
        segmentColorToken={segmentColorToken}
      />
      {showModeratorQuestion ? (
        <p className="text-[11px] leading-snug text-muted-foreground/70">
          <span className="font-medium uppercase tracking-wide">Q:</span>{" "}
          {moderatorQuestion}
        </p>
      ) : null}
      {chunkPreview ? (
        <p className="text-sm italic leading-relaxed text-foreground/80">
          &ldquo;{chunkPreview}&rdquo;
        </p>
      ) : null}
    </div>
  )
}

/**
 * Full-height Dialog listing every interview chunk attached to the source.
 *
 * Title reads "Interview Quotes (N)" where N is the live chunk count (preferring
 * `quoteCount` when the parser set it). The trigger is supplied by the caller
 * so this component can wrap an inline pill button (fallback path) or a
 * footer chip button identically. Segment badges colour-match the admin-set
 * `segment_color_token` via {@link resolveSegmentColorToken}; pass the
 * already-resolved persona list (typically `resolveSegmentPersonasFromFiles`).
 */
export function InterviewQuotesDialog({
  source,
  trigger,
  segmentPersonas = MOCK_SEGMENT_PERSONAS,
}: {
  source: ChatCitationSource
  trigger: ReactNode
  segmentPersonas?: PersonaMock[]
}) {
  const chunks: InterviewChunkData[] = source.interviewChunks ?? []
  const count = source.quoteCount ?? chunks.length
  const HeaderIcon = resolveInterviewHeaderIcon(source)

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl border-2 p-0 sm:rounded-2xl"
        style={citeColorBorderStyle(source.citeColorToken)}
      >
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <HeaderIcon className="h-4 w-4 shrink-0 text-arse-black/60" />
            Interview Quotes
            <span className="text-sm font-normal text-muted-foreground">
              ({count})
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Aggregated qualitative interview quotes cited in this answer.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="divide-y divide-border px-5 pb-2">
            {chunks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No interview excerpts available.
              </p>
            ) : (
              chunks.map((chunk, idx) => (
                <ChunkListItem
                  key={`${chunk.respondent_id ?? idx}-${idx}`}
                  chunk={chunk}
                  segmentPersonas={segmentPersonas}
                />
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Inline `[4]` chip with parity to other source citations:
 *
 * - **Hover** surfaces a Tooltip with the matched chunk's moderator question
 *   (preferred) or chunk preview, plus segment + demographics — same trigger
 *   semantics as `[1]`/`[2]`/`[3]`.
 * - **Click** falls back to {@link InterviewQuotesDialog} when no chunk
 *   matches the preceding text (or the matched chunk has neither a usable
 *   moderator question nor preview), so the user always lands on the cited
 *   evidence rather than seeing an empty tooltip.
 */
export function InlineInterviewCitation({
  source,
  content,
  markerPosition,
  ariaLabel,
  segmentPersonas = MOCK_SEGMENT_PERSONAS,
  variant = "default",
}: {
  source: ChatCitationSource
  /** Original assistant `message.content` (raw markdown, pre-rewrite). */
  content: string
  /** Absolute character offset of the `[4]` marker in `content`. */
  markerPosition: number
  ariaLabel: string
  segmentPersonas?: PersonaMock[]
  /**
   * Surface variant; mirrors the existing citation tooltip variants so the
   * `[4]` popover matches the other source tooltips on the same surface
   * (`compact` = dashboard `ChatWindow`, `default` = client `ProjectChat`).
   */
  variant?: InterviewCitationVariant
}) {
  const chunks = source.interviewChunks ?? []
  const precedingText =
    content && markerPosition > 0
      ? content.slice(
          Math.max(0, markerPosition - PRECEDING_TEXT_WINDOW),
          markerPosition
        )
      : ""
  const matched = precedingText
    ? findChunkByContext(chunks, precedingText)
    : null

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

  if (matched) {
    const moderatorQuestion = matched.moderator_question?.trim() ?? ""
    const hasModeratorQuestion =
      moderatorQuestion.length >= MODERATOR_QUESTION_MIN_LEN
    const chunkPreview = matched.chunk_preview?.trim() ?? ""
    const hasChunkPreview = chunkPreview.length >= MODERATOR_QUESTION_MIN_LEN

    if (hasModeratorQuestion || hasChunkPreview) {
      const body = hasModeratorQuestion
        ? moderatorQuestion
        : clampText(chunkPreview, CHUNK_PREVIEW_CLAMP)
      const segmentColorToken = resolveSegmentColorToken(
        matched.interview_segment,
        segmentPersonas
      )
      const HeaderIcon = resolveInterviewHeaderIcon(source)
      const isCompact = variant === "compact"
      const bodyClass = isCompact
        ? "mt-2 text-[11px] leading-relaxed text-arse-black/85"
        : "mt-3 rounded-xl border border-arse-black/10 bg-white p-3 text-xs leading-relaxed text-arse-black/85"
      const demographicsMarginClass = isCompact ? "mt-2" : "mt-3"

      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent
            side="top"
            className={citationTooltipContentClass(
              variant,
              source.citeColorToken,
              source
            )}
            style={citationTooltipContentStyle(source.citeColorToken)}
          >
            <div className="flex items-center gap-2 text-sm font-semibold leading-none">
              <HeaderIcon
                className={cn(
                  "shrink-0 text-arse-black/60",
                  isCompact ? "h-3.5 w-3.5" : "h-4 w-4"
                )}
              />
              <p className="leading-none">
                {hasModeratorQuestion ? "Moderator Question" : "Interview Quote"}
              </p>
            </div>
            <p className={bodyClass}>{body}</p>
            <div className={demographicsMarginClass}>
              <ChunkDemographicsRow
                chunk={matched}
                segmentColorToken={segmentColorToken}
              />
            </div>
          </TooltipContent>
        </Tooltip>
      )
    }
  }

  return (
    <InterviewQuotesDialog
      source={source}
      trigger={button}
      segmentPersonas={segmentPersonas}
    />
  )
}
