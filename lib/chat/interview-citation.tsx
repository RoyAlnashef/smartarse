"use client"

/**
 * Inline `[4]` interview-citation chip + aggregated quotes dialog.
 *
 * Ported and re-skinned from the Disrupt citation prototype
 * (`agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/CitationChip.tsx`).
 *
 * Two surfaces live in this file:
 *
 * - {@link InlineInterviewCitation}: click-Popover for an inline `[4]` pill
 *   that shows the specific interview chunk matched against the preceding
 *   sentence. Falls back to {@link InterviewQuotesDialog} when no chunk can
 *   be matched (e.g. AI placed a single `[4]` at the end of a header that
 *   summarises multiple quotes below it).
 *
 * - {@link InterviewQuotesDialog}: click-Dialog that aggregates every cited
 *   interview chunk on the source. Triggered from both the inline fallback
 *   and the footer `[4]` chip.
 *
 * Other citation indices ([1]/[2]/[3]) continue to use the existing hover
 * Tooltip path in `message-bubble.tsx` / `project-chat.tsx` /
 * `chat-citation-sources-footer.tsx`.
 */

import { MessageSquareQuote } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import type { ChatCitationSource, InterviewChunkData } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { findChunkByContext } from "@/lib/citation-utils"
import {
  MOCK_SEGMENT_PERSONAS,
  type PersonaMock,
} from "@/lib/personas/segment-mocks"
import {
  citeColorCssValue,
  citeSourceIndexBadgeCn,
  citeSourceIndexBadgeStyle,
} from "@/lib/theme/cite-color-tokens"
import { cn } from "@/lib/utils"

const PRECEDING_TEXT_WINDOW = 200
const CHUNK_PREVIEW_CLAMP = 320
const MODERATOR_QUESTION_MIN_LEN = 20

function clampText(value: string, max: number): string {
  if (value.length <= max) return value
  return value.slice(0, max).trimEnd() + "\u2026"
}

/** Strip leading "The " and lower-case so "The Minimalists" / "minimalists" both match. */
function normalizeSegmentKey(value: string | null | undefined): string {
  if (!value) return ""
  return value
    .toLowerCase()
    .replace(/^the\s+/, "")
    .trim()
}

/**
 * Resolve the admin-set cite color token for an interview chunk's segment
 * label by fuzzy-matching against the project's `segmentPersonas` list.
 *
 * `chunk.interview_segment` comes from the n8n payload and may be a short
 * variant ("Minimalists") of the persona title ("The Minimalists"); we
 * normalise both sides and accept partial overlaps either way.
 */
function interviewSegmentColorToken(
  segmentName: string | null | undefined,
  personas: PersonaMock[]
): string | null {
  const key = normalizeSegmentKey(segmentName)
  if (!key) return null
  for (const persona of personas) {
    const personaKey = normalizeSegmentKey(persona.title)
    if (!personaKey) continue
    if (
      personaKey === key ||
      personaKey.includes(key) ||
      key.includes(personaKey)
    ) {
      return persona.colorCiteToken ?? null
    }
  }
  return null
}

function segmentBadgeStyle(token: string | null | undefined): CSSProperties | undefined {
  if (!token) return undefined
  const hex = citeColorCssValue(token)
  return {
    backgroundColor: `${hex}1f`,
    color: hex,
  }
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
  const segmentColorToken = interviewSegmentColorToken(
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
 * `segment_color_token` via {@link interviewSegmentColorToken}; pass the
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

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageSquareQuote className="h-4 w-4 shrink-0 text-emerald-600" />
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
 * Inline `[4]` chip rendered in place of the existing hover Tooltip for
 * `sourceType === "interview"`. Clicking opens a Popover with the matched
 * chunk's moderator question (preferred) or chunk preview, plus segment +
 * demographics. When no chunk matches the preceding text — or the matched
 * chunk has neither a usable moderator question nor preview — the same
 * trigger falls back to {@link InterviewQuotesDialog} so the user always
 * lands on the cited evidence.
 */
export function InlineInterviewCitation({
  source,
  content,
  markerPosition,
  ariaLabel,
  segmentPersonas = MOCK_SEGMENT_PERSONAS,
}: {
  source: ChatCitationSource
  /** Original assistant `message.content` (raw markdown, pre-rewrite). */
  content: string
  /** Absolute character offset of the `[4]` marker in `content`. */
  markerPosition: number
  ariaLabel: string
  segmentPersonas?: PersonaMock[]
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
      const segmentColorToken = interviewSegmentColorToken(
        matched.interview_segment,
        segmentPersonas
      )

      return (
        <Popover>
          <PopoverTrigger asChild>{button}</PopoverTrigger>
          <PopoverContent
            className="w-80 p-3"
            sideOffset={8}
            align="end"
            collisionPadding={16}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-sm font-medium text-foreground">
                  {hasModeratorQuestion ? "Moderator Question" : "Interview Quote"}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {body}
              </p>
              <ChunkDemographicsRow
                chunk={matched}
                segmentColorToken={segmentColorToken}
              />
            </div>
          </PopoverContent>
        </Popover>
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
