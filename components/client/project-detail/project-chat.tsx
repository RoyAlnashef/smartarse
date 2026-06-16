"use client"

import { useEffect, useMemo, useRef, useState, type AnchorHTMLAttributes } from "react"
import { Send, SlidersHorizontal, Square } from "lucide-react"
import Image from "next/image"
import robotAvatar from "@/public/robot-avatar.png"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type {
  ChatMessage,
  CustomAudienceActivatedEvent,
  ChatCitationSource,
  ChatTimelineItem,
  FocusGroupResponse,
  FocusGroupRound,
  FocusGroupSession,
  PersonaActivatedEvent,
  SavedCustomAudience,
} from "@/lib/types"
import {
  isCustomAudienceActivatedEvent,
  isPersonaActivatedEvent,
  isPersonaEndedEvent,
} from "@/lib/types"
import {
  buildCitationLabelLookup,
  citationSourcePrimaryLabel,
  isInterviewCitationSource,
  mergeCitationSourcesWithDocColors,
  mergeCitationSourcesWithDocIcons,
  resolveCitationLinkTitle,
  type CitationDocumentRef,
  type CitationLabelLookup,
} from "@/lib/documents/display-label"
import {
  CitationTooltipBody,
  citationTooltipContentClass,
  citationTooltipContentStyle,
} from "@/lib/chat/citation-tooltip"
import { InlineInterviewCitation } from "@/lib/chat/interview-citation"
import {
  parseCitationHref,
  resolveInlineCitation,
  rewriteInlineCitationMarkers,
} from "@/lib/chat/inline-citations"
import {
  citeColorCssValue,
  citeColorDotFillStyle,
  citeSourceIndexBadgeCn,
  citeSourceIndexBadgeStyle,
  isCiteColorDotFillToken,
} from "@/lib/theme/cite-color-tokens"
import {
  formatLocalDate,
  formatLocalTime,
  isLocalToday,
} from "@/lib/datetime"
import { cn } from "@/lib/utils"
import { ChatCitationSourcesFooter } from "@/components/chat/chat-citation-sources-footer"
import {
  CHAT_AVATAR_SIZE_CLASS,
  CHAT_AVATAR_TEXT_CLASS,
  ChatMessageRow,
} from "@/components/chat/chat-message-row"
import {
  buildChatMarkdownComponents,
  CHAT_BUBBLE_MAX_WIDTH_CLASS,
  chatMarkdownProseClass,
  citationIndexFromText,
  externalMarkdownLinkClass,
  textFromReactChildren,
} from "@/components/chat/chat-markdown-prose"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PERSONA_CHAT_SHELL_CLASS } from "@/components/client/project-detail/persona-chat-shell-classes"
import type { PersonaMock } from "@/lib/personas/segment-mocks"
import { MOCK_SEGMENT_PERSONAS } from "@/lib/personas/segment-mocks"
import { audienceStackColorTokens } from "@/lib/theme/custom-audience-theme"
import { chatToneForSavedCustomAudience } from "@/lib/theme/custom-audience-dominant-persona"
import {
  DEFAULT_CHAT_TONE,
  personaChatToneFromCiteToken,
} from "@/lib/theme/persona-chat-tone"
import { personaSegmentDotClass } from "@/lib/theme/persona-segment-theme"

const LOADING_ACTIONS = [
  "Processing your brilliance...",
  "Thinking very hard in spreadsheets...",
  "Mathematizing the chaos...",
  "Comprehenderizing your question...",
  "Cross-referencing the data goblins...",
  "Crunching numbers with dramatic flair...",
  "Looking for patterns and plot twists...",
  "Triangulating insights at unsafe speed...",
]

function getRandomLoadingActionIndex(excludeIndex?: number): number {
  if (LOADING_ACTIONS.length <= 1) return 0
  let next = Math.floor(Math.random() * LOADING_ACTIONS.length)
  while (excludeIndex != null && next === excludeIndex) {
    next = Math.floor(Math.random() * LOADING_ACTIONS.length)
  }
  return next
}

function Avatar({ label, isLoading = false }: { label: string; isLoading?: boolean }) {
  const isAiAvatar = label.toUpperCase() === "AI"

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-transparent font-arse-title font-bold uppercase text-arse-black",
        CHAT_AVATAR_SIZE_CLASS,
        CHAT_AVATAR_TEXT_CLASS,
        isAiAvatar ? "rounded-none" : "rounded-full border border-arse-black sm:border-2"
      )}
    >
      {isAiAvatar ? (
        <Image
          src={robotAvatar}
          alt="AI avatar"
          fill
          sizes="(max-width: 640px) 24px, 32px"
          className={cn("object-cover", isLoading && "animate-spin")}
        />
      ) : (
        label
      )}
    </div>
  )
}

function MessageBubble({
  message,
  citationLookup,
  citations,
  citationDocuments,
  segmentPersonas,
  assistantTone = DEFAULT_CHAT_TONE,
}: {
  message: ChatMessage
  /** When set (assistant only), link `title` tooltips prefer document display names. */
  citationLookup: CitationLabelLookup | null
  citations?: ChatCitationSource[]
  /** Ordered ready project documents; merges cite colors onto citations by index. */
  citationDocuments?: CitationDocumentRef[]
  /** Resolved persona list; drives segment-badge colors in `[4]` interview citations. */
  segmentPersonas?: PersonaMock[]
  assistantTone?: { cardBorder: string; cardBg: string; headingText: string; dotBg: string }
}) {
  const isUser = message.role === "user"
  const mergedCitations = useMemo(() => {
    const docs = citationDocuments ?? []
    const colors = mergeCitationSourcesWithDocColors(citations ?? [], docs)
    return mergeCitationSourcesWithDocIcons(colors, docs)
  }, [citations, citationDocuments])
  const citationSourcesByIndex = useMemo(() => {
    const map = new Map<number, ChatCitationSource>()
    for (const source of mergedCitations) {
      map.set(source.index, source)
    }
    return map
  }, [mergedCitations])

  const renderedMarkdown = useMemo(() => {
    if (isUser) return message.content
    return rewriteInlineCitationMarkers(message.content, citationSourcesByIndex)
  }, [citationSourcesByIndex, isUser, message.content])

  const markdownComponents = useMemo(() => {
    const linkRenderer = ({
      node: _node,
      href,
      title,
      children,
      ...rest
    }: AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown }) => {
      const hrefParts = parseCitationHref(href)
      const citationIndexFromLink = hrefParts?.index ?? null
      const citationIndexFromLinkText = citationIndexFromText(
        textFromReactChildren(children)
      )
      const citationIndex = citationIndexFromLink ?? citationIndexFromLinkText
      if (citationIndex != null) {
        const source = citationSourcesByIndex.get(citationIndex)
        if (source) {
          const primaryLabel = citationSourcePrimaryLabel(source)
          const inlineCitation = resolveInlineCitation(
            message.inlineCitations,
            citationIndex,
            hrefParts?.occurrence ?? 0
          )
          if (isInterviewCitationSource(source)) {
            return (
              <InlineInterviewCitation
                source={source}
                content={message.content}
                markerPosition={inlineCitation?.marker_position ?? 0}
                ariaLabel={`Citation ${citationIndex}: ${primaryLabel}`}
                segmentPersonas={segmentPersonas}
                variant="default"
              />
            )
          }
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    citeSourceIndexBadgeCn(citationIndex, source.citeColorToken),
                    "mx-0.5 align-middle transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink focus-visible:ring-offset-2"
                  )}
                  style={citeSourceIndexBadgeStyle(source.citeColorToken)}
                  aria-label={`Citation ${citationIndex}: ${primaryLabel}`}
                >
                  {citationIndex}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className={citationTooltipContentClass("default", source.citeColorToken, source)}
                style={citationTooltipContentStyle(source.citeColorToken)}
              >
                <CitationTooltipBody
                  source={source}
                  primaryLabel={primaryLabel}
                  inlineCitation={inlineCitation}
                  segmentPersonas={segmentPersonas}
                />
              </TooltipContent>
            </Tooltip>
          )
        }
      }
      const resolvedTitle =
        citationLookup != null
          ? resolveCitationLinkTitle(citationLookup, href, title)
          : title
      return (
        <a
          {...rest}
          href={href}
          title={resolvedTitle}
          target="_blank"
          rel="noreferrer noopener"
          className={externalMarkdownLinkClass("client")}
        >
          {children}
        </a>
      )
    }

    return buildChatMarkdownComponents("client", linkRenderer)
  }, [
    citationLookup,
    citationSourcesByIndex,
    message.content,
    message.inlineCitations,
    segmentPersonas,
  ])

  const markdownShell = chatMarkdownProseClass({ variant: "client" })

  return (
    <ChatMessageRow
      role={isUser ? "user" : "assistant"}
      avatar={<Avatar label={isUser ? "ME" : "AI"} />}
    >
      <div
        className={cn(
          CHAT_BUBBLE_MAX_WIDTH_CLASS,
          "rounded-2xl border-2 px-4 text-sm leading-[1.7]",
          isUser
            ? "ml-auto w-fit max-w-full border-zinc-800 bg-zinc-800 py-3 text-white sm:ml-0 sm:w-full"
            : cn(
                assistantTone.cardBorder,
                assistantTone.cardBg,
                "py-5 text-arse-black sm:py-6"
              )
        )}
      >
        <div className={markdownShell}>
          <TooltipProvider delayDuration={120}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {renderedMarkdown}
            </ReactMarkdown>
            {!isUser && mergedCitations.length > 0 ? (
              <ChatCitationSourcesFooter
                sources={mergedCitations}
                tooltipVariant="default"
                messageContent={message.content}
                inlineCitations={message.inlineCitations}
                segmentPersonas={segmentPersonas}
              />
            ) : null}
          </TooltipProvider>
        </div>
      </div>
    </ChatMessageRow>
  )
}

function formatEventTimestamp(iso: string): string {
  if (isLocalToday(iso)) {
    return formatLocalTime(iso)
  }
  return formatLocalDate(iso, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function getGreetingName(userName?: string | null): string {
  const normalized = userName?.trim()
  if (!normalized) return "there"
  const firstName = normalized.split(/\s+/)[0]
  return firstName || "there"
}

function PersonaEventBubble({
  event,
  persona,
}: {
  event: PersonaActivatedEvent
  persona: PersonaMock
}) {
  const tone = personaChatToneFromCiteToken(persona.colorCiteToken)

  return (
    <div
      className="w-full"
      role="status"
      aria-label={`Segment persona activated: ${persona.title} at ${formatEventTimestamp(event.timestamp)}`}
    >
      <div
        className={cn(
          "w-full rounded-2xl border px-4 py-3 text-sm text-arse-black",
          tone.cardBorder,
          tone.cardBg
        )}
      >
        <p
          className={cn(
            "font-arse-title text-[10px] font-bold uppercase tracking-wide",
            tone.headingText
          )}
        >
          <span
            className={cn(
              "mr-1 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full",
              !isCiteColorDotFillToken(persona.colorCiteToken) && tone.dotBg
            )}
            style={citeColorDotFillStyle(persona.colorCiteToken)}
          />{" "}
          Speaking as {persona.title}
          <span className="ml-2 font-arse-body normal-case text-arse-black/50">
            {formatEventTimestamp(event.timestamp)}
          </span>
        </p>
        <p className="mt-2 font-arse-body text-sm leading-relaxed text-arse-black/85">
          <strong>Segment persona activated.</strong> You&apos;re now speaking with the collective
          perspective of <strong>{persona.title}</strong> (n={persona.surveyN}, {persona.surveyPctLabel}).
        </p>
        <p className="mt-2 font-arse-body text-xs text-arse-black/70">
          Avg concern: <strong>{persona.avgConcern}</strong> · Avg actions:{" "}
          <strong>{persona.avgActions}</strong>
        </p>
        <p className="mt-2 font-arse-body text-xs text-arse-black/65">
          Ask about this segment&apos;s views, barriers, or motivations.
        </p>
      </div>
    </div>
  )
}

function FocusGroupResponseBubble({
  response,
}: {
  response: FocusGroupResponse
}) {
  const dotFill = citeColorDotFillStyle(response.participantColorToken)
  const colorCss = citeColorCssValue(response.participantColorToken)
  const tinted = colorCss ? `${colorCss}33` : "rgba(20,20,20,0.18)"
  return (
    <div className="flex items-start gap-2.5">
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-arse-title text-[10px] font-bold uppercase text-white",
          !isCiteColorDotFillToken(response.participantColorToken) &&
            personaSegmentDotClass(response.participantColorToken, "bg-arse-black")
        )}
        style={isCiteColorDotFillToken(response.participantColorToken) ? dotFill : undefined}
        aria-hidden
      >
        {response.participantLabel.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="font-arse-title text-[10px] font-bold uppercase tracking-wide"
          style={colorCss ? { color: colorCss } : undefined}
        >
          {response.participantLabel}
        </p>
        <div
          className={cn(
            "mt-1 rounded-2xl rounded-tl-sm border px-3.5 py-2.5 font-arse-body text-sm leading-relaxed text-arse-black",
            response.isPlaceholder ? "italic text-arse-black/55" : null
          )}
          style={{ borderColor: tinted, backgroundColor: "white" }}
        >
          {response.content}
        </div>
      </div>
    </div>
  )
}

function FocusGroupThinkingIndicator({
  label,
  colorToken,
}: {
  label: string
  colorToken: string
}) {
  const dotFill = citeColorDotFillStyle(colorToken)
  const colorCss = citeColorCssValue(colorToken)
  return (
    <div
      className="flex items-start gap-2.5"
      role="status"
      aria-live="polite"
      aria-label={`${label} is thinking`}
    >
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-arse-title text-[10px] font-bold uppercase text-white",
          !isCiteColorDotFillToken(colorToken) &&
            personaSegmentDotClass(colorToken, "bg-arse-black")
        )}
        style={isCiteColorDotFillToken(colorToken) ? dotFill : undefined}
        aria-hidden
      >
        {label.charAt(0).toUpperCase()}
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-arse-black/10 bg-white px-3 py-2 font-arse-body text-xs text-arse-black/60">
        <span className="flex gap-1" aria-hidden>
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{
              backgroundColor: colorCss ?? "currentColor",
              animationDelay: "0ms",
            }}
          />
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{
              backgroundColor: colorCss ?? "currentColor",
              animationDelay: "150ms",
            }}
          />
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{
              backgroundColor: colorCss ?? "currentColor",
              animationDelay: "300ms",
            }}
          />
        </span>
        <span>{label} is thinking…</span>
      </div>
    </div>
  )
}

function FocusGroupRoundTopicBubble({
  roundNumber,
  topic,
  inProgress = false,
}: {
  roundNumber: number
  topic: string
  inProgress?: boolean
}) {
  return (
    <div aria-label={`Round ${roundNumber} topic`}>
      <ChatMessageRow role="user" avatar={<Avatar label="ME" />}>
      <div className={cn(CHAT_BUBBLE_MAX_WIDTH_CLASS, "ml-auto flex w-fit max-w-full flex-col items-end sm:ml-0 sm:w-full")}>
        <div className="mb-1 flex items-center gap-2">
          <span className="font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/55">
            Round {roundNumber}
          </span>
          {inProgress ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-arse-pink/15 px-2 py-0.5 font-arse-title text-[9px] font-bold uppercase tracking-wide text-arse-pink">
              Live
            </span>
          ) : null}
        </div>
        <div
          className={cn(
            "rounded-2xl border-2 px-4 py-3 text-sm leading-[1.7] border-zinc-800 bg-zinc-800 text-white",
            "break-words"
          )}
        >
          {topic}
        </div>
      </div>
      </ChatMessageRow>
    </div>
  )
}

function FocusGroupTranscriptRound({
  round,
}: {
  round: FocusGroupRound
}) {
  return (
    <div className="space-y-4">
      <FocusGroupRoundTopicBubble
        roundNumber={round.roundNumber}
        topic={round.topic}
      />
      {round.responses.map((r, idx) => (
        <FocusGroupResponseBubble
          key={`${round.roundRequestId}-${idx}`}
          response={r}
        />
      ))}
    </div>
  )
}

function FocusGroupLiveRound({
  roundNumber,
  topic,
  responses,
  activeParticipantIndex,
  participants,
}: {
  roundNumber: number
  topic: string
  responses: FocusGroupResponse[]
  activeParticipantIndex: number | null
  participants: FocusGroupSession["participants"]
}) {
  const activeParticipant =
    activeParticipantIndex != null && activeParticipantIndex < participants.length
      ? participants[activeParticipantIndex]
      : null
  return (
    <div className="space-y-4">
      <FocusGroupRoundTopicBubble
        roundNumber={roundNumber}
        topic={topic}
        inProgress
      />
      {responses.map((r, idx) => (
        <FocusGroupResponseBubble
          key={`live-${roundNumber}-${idx}`}
          response={r}
        />
      ))}
      {activeParticipant ? (
        <FocusGroupThinkingIndicator
          label={activeParticipant.label}
          colorToken={activeParticipant.colorToken}
        />
      ) : null}
    </div>
  )
}

function CustomAudienceEventBubble({
  event,
  audience,
}: {
  event: CustomAudienceActivatedEvent
  audience: SavedCustomAudience | null
}) {
  const tone = audience ? chatToneForSavedCustomAudience(audience) : DEFAULT_CHAT_TONE
  const stackTokens = audienceStackColorTokens(
    audience?.childSegmentColorTokens ?? [],
    null
  )
  const childSegments = event.childSegmentNames.length
    ? event.childSegmentNames
    : audience?.snapshot.childSegments.map((segment) => segment.name) ?? []
  const segmentSummary =
    childSegments.length > 0 ? childSegments.join(", ") : "Custom segment blend"

  return (
    <div
      className="w-full"
      role="status"
      aria-label={`Custom audience activated: ${event.customAudienceName} at ${formatEventTimestamp(event.timestamp)}`}
    >
      <div
        className={cn(
          "w-full rounded-2xl border px-4 py-3 text-sm text-arse-black",
          tone.cardBorder,
          tone.cardBg
        )}
      >
        <p
          className={cn(
            "font-arse-title text-[10px] font-bold uppercase tracking-wide",
            tone.headingText
          )}
        >
          <span className="mr-1 inline-flex -space-x-1 align-middle" aria-hidden>
            {(stackTokens.length > 0 ? stackTokens : ["violet-500"]).slice(0, 4).map((token, index) => (
              <span
                key={`${event.id}-${token}-${index}`}
                className={cn(
                  "inline-flex h-1.5 w-1.5 rounded-full border border-white/70",
                  !isCiteColorDotFillToken(token) && personaSegmentDotClass(token, "bg-arse-pink")
                )}
                style={citeColorDotFillStyle(token)}
              />
            ))}
          </span>{" "}
          Speaking as {event.customAudienceName}
          <span className="ml-2 font-arse-body normal-case text-arse-black/50">
            {formatEventTimestamp(event.timestamp)}
          </span>
        </p>
        <p className="mt-2 font-arse-body text-sm leading-relaxed text-arse-black/85">
          <strong>Custom audience activated.</strong> You&apos;re now speaking with{" "}
          {event.customAudienceName}.
        </p>
        <p className="mt-2 font-arse-body text-xs text-arse-black/70">
          Segments: <strong>{segmentSummary}</strong>
        </p>
        <p className="mt-2 font-arse-body text-xs text-arse-black/65">
          Avg concern: <strong>{event.avgConcern?.toFixed?.(1) ?? "n/a"}</strong> · n=
          <strong>{event.baseSize ?? "n/a"}</strong>
        </p>
      </div>
    </div>
  )
}

export function ProjectChat({
  messages,
  timelineEvents = [],
  orderedTimelineItems = null,
  citationDocuments,
  isLoading = false,
  disabled,
  disabledInputTooltip,
  controlsDisabled = false,
  appliedPersonaId,
  appliedCustomAudience = null,
  focusGroupSession = null,
  focusGroupRounds = [],
  liveFocusGroupRound = null,
  focusGroupRunning = false,
  onSend,
  onOpenPersonas,
  onStop,
  personasColumnCollapsed = false,
  onPersonaActivated,
  onPersonaEnded,
  userName,
  segmentPersonas = MOCK_SEGMENT_PERSONAS,
}: {
  messages: ChatMessage[]
  timelineEvents?: ChatTimelineItem[]
  /**
   * When set (e.g. loaded history with `arse_message_thread`), render this list in order
   * without merging/sorting with `messages` / `timelineEvents`.
   */
  orderedTimelineItems?: ChatTimelineItem[] | null
  /** Ready project documents — used to improve assistant markdown link tooltips. */
  citationDocuments?: CitationDocumentRef[]
  isLoading?: boolean
  disabled?: boolean
  /** Shown when `disabled` is true (e.g. hover over blocked input). */
  disabledInputTooltip?: string
  controlsDisabled?: boolean
  appliedPersonaId: string | null
  appliedCustomAudience?: SavedCustomAudience | null
  /** Active focus-group session; when set, replaces normal transcript with round bubbles. */
  focusGroupSession?: FocusGroupSession | null
  /** Completed rounds in chronological order. */
  focusGroupRounds?: FocusGroupRound[]
  /** In-flight round (partial responses + "X is thinking…" indicator). */
  liveFocusGroupRound?: {
    roundNumber: number
    topic: string
    responses: FocusGroupResponse[]
    activeParticipantIndex: number | null
  } | null
  /** True while any participant round is in flight. */
  focusGroupRunning?: boolean
  onSend?: (content: string) => void
  onOpenPersonas?: () => void
  onStop?: () => void
  /** When true at lg+, show Controls to restore the inline personas column. */
  personasColumnCollapsed?: boolean
  onPersonaActivated?: (personaId: string) => void
  onPersonaEnded?: (personaId: string) => void
  userName?: string | null
  segmentPersonas?: PersonaMock[]
}) {
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState("")
  const [loadingActionIndex, setLoadingActionIndex] = useState(0)

  const appliedPersona = useMemo(
    () =>
      appliedPersonaId
        ? (segmentPersonas.find((p) => p.id === appliedPersonaId) ?? null)
        : null,
    [appliedPersonaId, segmentPersonas]
  )

  const citationLookup = useMemo((): CitationLabelLookup | null => {
    if (!citationDocuments || citationDocuments.length === 0) return null
    return buildCitationLabelLookup(citationDocuments)
  }, [citationDocuments])

  const timelineItems = useMemo((): ChatTimelineItem[] => {
    if (orderedTimelineItems != null) {
      return orderedTimelineItems
    }
    const items: ChatTimelineItem[] = [...messages, ...timelineEvents]
    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    return items
  }, [messages, timelineEvents, orderedTimelineItems])

  useEffect(() => {
    if (!isLoading) {
      setLoadingActionIndex(0)
      return
    }
    setLoadingActionIndex(getRandomLoadingActionIndex())
    const intervalId = window.setInterval(() => {
      setLoadingActionIndex((prev) => getRandomLoadingActionIndex(prev))
    }, 3400)
    return () => window.clearInterval(intervalId)
  }, [isLoading])

  const focusGroupActive = Boolean(focusGroupSession)
  const inputPlaceholder = focusGroupActive
    ? focusGroupRunning
      ? "Waiting for the current round to finish…"
      : "Ask a follow-up question to start the next round…"
    : appliedPersona
      ? `Ask about ${appliedPersona.title}…`
      : appliedCustomAudience
        ? `Ask about ${appliedCustomAudience.name}…`
        : "Ask me anything about this project…"

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    function syncTextareaHeight() {
      const savedValue = textarea.value
      const isEmpty = !savedValue.trim()
      if (isEmpty && textarea.placeholder) {
        textarea.value = textarea.placeholder
      }
      textarea.style.height = "0px"
      const measuredHeight = textarea.scrollHeight
      const nextHeight = Math.min(Math.max(measuredHeight, 44), 220)
      textarea.style.height = `${nextHeight}px`
      textarea.style.overflowY = measuredHeight > 220 ? "auto" : "hidden"
      textarea.value = savedValue
    }

    syncTextareaHeight()
    window.addEventListener("resize", syncTextareaHeight)
    return () => window.removeEventListener("resize", syncTextareaHeight)
  }, [value, inputPlaceholder])

  const contextResetKey = `${appliedPersonaId ?? ""}::${appliedCustomAudience?.id ?? ""}::${focusGroupSession?.id ?? ""}`

  useEffect(() => {
    setValue("")
    if (!disabled) {
      textareaRef.current?.focus()
    }
  }, [contextResetKey, disabled])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend?.(trimmed)
    setValue("")
  }

  const greetingName = getGreetingName(userName)
  const activeChatTone = appliedPersona
    ? personaChatToneFromCiteToken(appliedPersona.colorCiteToken)
    : appliedCustomAudience
      ? chatToneForSavedCustomAudience(appliedCustomAudience)
      : DEFAULT_CHAT_TONE

  const textareaClassName = cn(
    "block min-w-0 flex-1 resize-none rounded-xl border-4 border-arse-black bg-zinc-100 px-4 pb-4 pt-3 font-arse-body text-sm leading-snug text-arse-black placeholder:text-arse-black/45",
    "focus:outline-none focus:ring-2 disabled:opacity-50",
    activeChatTone.inputFocusRing,
    disabled && disabledInputTooltip && "pointer-events-none"
  )

  return (
    <section
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border-4 bg-zinc-50",
        activeChatTone.shellBorder,
        PERSONA_CHAT_SHELL_CLASS
      )}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => onOpenPersonas?.()}
          disabled={controlsDisabled}
          aria-label="Open personas and studio controls"
          className={cn(
            "absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-xl border-2 border-arse-black bg-white px-3 py-1.5 font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black shadow-[3px_3px_0_0_var(--arse-pink)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_var(--arse-pink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink sm:right-4 sm:top-4",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_0_var(--arse-pink)]",
            !personasColumnCollapsed && "lg:hidden"
          )}
        >
          {appliedPersona || appliedCustomAudience ? (
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                  activeChatTone.dotPing
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  activeChatTone.dotBg
                )}
              />
            </span>
          ) : null}
          <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          Controls
        </button>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            ref={scrollViewportRef}
            className="h-full overflow-x-hidden overflow-y-auto p-4 pt-12 pr-1 sm:px-6 sm:pb-6 sm:pt-12 lg:p-6"
          >
            {focusGroupActive && focusGroupSession ? (
              <div className="space-y-6">
                {focusGroupRounds.length === 0 && !liveFocusGroupRound ? (
                  <div className="rounded-2xl border border-arse-black/10 bg-white px-4 py-6 text-center font-arse-body text-sm text-arse-black/65">
                    {focusGroupRunning
                      ? "Focus group starting — participants will respond in turn."
                      : "No rounds yet. Type a topic in the chat input to start Round 1, or end the focus group from the right rail to cancel."}
                  </div>
                ) : null}
                {focusGroupRounds.map((round) => (
                  <FocusGroupTranscriptRound
                    key={`fg-${round.roundRequestId}`}
                    round={round}
                  />
                ))}
                {liveFocusGroupRound ? (
                  <FocusGroupLiveRound
                    roundNumber={liveFocusGroupRound.roundNumber}
                    topic={liveFocusGroupRound.topic}
                    responses={liveFocusGroupRound.responses}
                    activeParticipantIndex={
                      liveFocusGroupRound.activeParticipantIndex
                    }
                    participants={focusGroupSession.participants}
                  />
                ) : null}
              </div>
            ) : timelineItems.length === 0 ? (
              <ChatMessageRow role="assistant" avatar={<Avatar label="AI" />}>
                <div className={CHAT_BUBBLE_MAX_WIDTH_CLASS}>
                  <div
                    className={cn(
                      "block rounded-2xl rounded-bl-sm border-2 px-4 py-4 text-sm text-arse-black sm:px-5 sm:py-5",
                      activeChatTone.cardBorder,
                      activeChatTone.cardBg
                    )}
                  >
                  <p className="font-arse-body leading-relaxed">
                    Hi {greetingName}!
                    <br />
                    I&apos;m <strong className="font-semibold">smartA.R.S.E.</strong>, your project
                    insight agent. You can ask me anything about your research project and I&apos;ll
                    answer based only on the input <strong className="font-semibold">Source</strong>{" "}
                    documents. Ask in plain language and I&apos;ll get what you need, but if you are
                    after something specific you can reference a source file or question directly.
                    Don&apos;t worry I won&apos;t answer anything not covered in your project and I
                    won&apos;t make anything up. All my answers will come with a citation detailing
                    exactly where in the <strong className="font-semibold">Source</strong> document I
                    found the answer.
                  </p>
                  <p className="mt-4 font-arse-body text-sm leading-relaxed text-arse-black/85">
                    If you&apos;d like to dig into different subgroups check out the{" "}
                    <strong className="font-semibold">Personas</strong> tab, where you can chat to a
                    representation of pre-defined audiences or create your own bespoke group to talk
                    to.
                  </p>
                  <p className="mt-4 font-arse-body text-sm font-semibold text-arse-black">
                    A few things to try:
                  </p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 font-arse-body text-sm leading-relaxed text-arse-black marker:text-arse-black/70">
                    <li>Summarise the big picture or the &lsquo;so what&rsquo; from the research</li>
                    <li>Identify themes, tensions or differences between audiences</li>
                    <li>Compare findings or ideas side by side</li>
                    <li>Pull key stats and facts for key audiences</li>
                    <li>
                      Get quotes that represent ideas or findings (if the project has qual/
                      verbatims)
                    </li>
                  </ul>
                    <p className="mt-4 font-arse-body text-sm leading-relaxed text-arse-black/85">
                      If you have any questions about using smartA.R.S.E. check out the{" "}
                      <a
                        href="/help/faq"
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-semibold underline decoration-arse-pink/60 underline-offset-2 hover:decoration-arse-pink"
                      >
                        FAQ
                      </a>{" "}
                      for anything regarding the research findings / implications then talk to your
                      Disrupt project team.
                      <br />
                      <br />
                      Time to start investigating…
                    </p>
                  </div>
                </div>
              </ChatMessageRow>
            ) : (
              <div className="space-y-4">
                {timelineItems.map((item) => {
                  if (isPersonaActivatedEvent(item)) {
                    const persona = segmentPersonas.find(
                      (p) => p.id === item.personaId
                    )
                    if (!persona) return null
                    return (
                      <PersonaEventBubble
                        key={item.id}
                        event={item}
                        persona={persona}
                      />
                    )
                  }
                  if (isPersonaEndedEvent(item)) {
                    const persona = segmentPersonas.find(
                      (p) => p.id === item.personaId
                    )
                    const personaName = persona?.title ?? "a persona"
                    return (
                      <p
                        key={item.id}
                        className="py-2 text-center font-arse-body text-sm text-arse-black/55"
                        role="status"
                        aria-label={`Persona session ended: ${personaName}`}
                      >
                        smartA.R.S.E. is no longer speaking as {personaName}.
                      </p>
                    )
                  }
                  if (isCustomAudienceActivatedEvent(item)) {
                    return (
                      <CustomAudienceEventBubble
                        key={item.id}
                        event={item}
                        audience={appliedCustomAudience}
                      />
                    )
                  }
                  return (
                    <MessageBubble
                      key={item.id}
                      message={item}
                      assistantTone={activeChatTone}
                      citationLookup={
                        item.role === "assistant" ? citationLookup : null
                      }
                      citations={item.role === "assistant" ? item.citations : undefined}
                      citationDocuments={
                        item.role === "assistant" ? citationDocuments : undefined
                      }
                      segmentPersonas={
                        item.role === "assistant" ? segmentPersonas : undefined
                      }
                    />
                  )
                })}
                {isLoading ? (
                  <div
                    role="status"
                    aria-live="polite"
                    aria-label="Assistant is preparing a response"
                  >
                    <ChatMessageRow
                      role="assistant"
                      avatar={<Avatar label="AI" isLoading />}
                    >
                    <div
                      className={cn(
                        CHAT_BUBBLE_MAX_WIDTH_CLASS,
                        "rounded-2xl rounded-bl-sm border-2 px-4 py-3 text-sm text-arse-black",
                        activeChatTone.cardBorder,
                        activeChatTone.cardBg
                      )}
                    >
                      <div className="flex items-center">
                        <p className="font-arse-body text-sm">{LOADING_ACTIONS[loadingActionIndex]}</p>
                      </div>
                    </div>
                    </ChatMessageRow>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-3 border-t-2 border-arse-black/10 bg-white p-4 sm:p-5"
        >
          <label className="sr-only" htmlFor="project-chat-input">
            Ask a question
          </label>
          {disabled && disabledInputTooltip ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="min-w-0 flex-1 cursor-not-allowed self-end">
                    <textarea
                      ref={textareaRef}
                      id="project-chat-input"
                      rows={1}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmit(e)
                        }
                      }}
                      placeholder={inputPlaceholder}
                      disabled={disabled}
                      title={disabledInputTooltip}
                      className={textareaClassName}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="center"
                  className="max-w-[min(20rem,calc(100vw-2.5rem))] border-arse-black/15 bg-white px-3 py-2 font-arse-body text-xs leading-snug text-arse-black shadow-md"
                >
                  {disabledInputTooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <textarea
              ref={textareaRef}
              id="project-chat-input"
              rows={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder={inputPlaceholder}
              disabled={disabled}
              className={textareaClassName}
            />
          )}
          <button
            type={isLoading ? "button" : "submit"}
            onClick={isLoading ? () => onStop?.() : undefined}
            disabled={
              isLoading ? !onStop : !value.trim() || disabled
            }
            title={isLoading ? "Stop ARSE from responding" : undefined}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-4 border-arse-black text-arse-black",
              "transition hover:translate-x-px hover:translate-y-px",
              isLoading
                ? "bg-red-500 text-white shadow-[4px_4px_0_0_var(--color-red-700)] hover:bg-red-600 hover:shadow-[3px_3px_0_0_var(--color-red-700)]"
                : "bg-white",
              !isLoading && activeChatTone.actionShadow,
              !isLoading && activeChatTone.actionShadowHover,
              "disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0",
              isLoading
                ? "disabled:hover:shadow-[4px_4px_0_0_var(--color-red-700)]"
                : activeChatTone.actionShadowDisabled
            )}
          >
            {isLoading ? (
              <>
                <Square className="h-4 w-4 fill-current" strokeWidth={2.5} />
                <span className="sr-only">Stop ARSE from responding</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" strokeWidth={2.5} />
                <span className="sr-only">Send message</span>
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  )
}
