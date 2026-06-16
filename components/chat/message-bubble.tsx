"use client"

import { useMemo, type AnchorHTMLAttributes } from "react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import robotAvatar from "@/public/robot-avatar.png"
import type { ChatCitationSource, ChatMessage } from "@/lib/types"
import {
  citationSourcePrimaryLabel,
  isInterviewCitationSource,
  mergeCitationSourcesWithDocColors,
  mergeCitationSourcesWithDocIcons,
  type CitationDocumentRef,
} from "@/lib/documents/display-label"
import { ChatCitationSourcesFooter } from "@/components/chat/chat-citation-sources-footer"
import {
  buildChatMarkdownComponents,
  CHAT_BUBBLE_MAX_WIDTH_CLASS,
  chatMarkdownProseClass,
  citationIndexFromText,
  externalMarkdownLinkClass,
  textFromReactChildren,
} from "@/components/chat/chat-markdown-prose"
import {
  CHAT_AVATAR_SIZE_CLASS,
  CHAT_AVATAR_TEXT_CLASS,
  ChatMessageRow,
} from "@/components/chat/chat-message-row"
import {
  CitationTooltipBody,
  citationTooltipContentClass,
  citationTooltipContentStyle,
} from "@/lib/chat/citation-tooltip"
import { InlineInterviewCitation } from "@/lib/chat/interview-citation"
import type { PersonaMock } from "@/lib/personas/segment-mocks"
import {
  parseCitationHref,
  resolveInlineCitation,
  rewriteInlineCitationMarkers,
} from "@/lib/chat/inline-citations"
import { citeSourceIndexBadgeCn, citeSourceIndexBadgeStyle } from "@/lib/theme/cite-color-tokens"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatLocalTime } from "@/lib/datetime"
import { cn } from "@/lib/utils"

function initialsFromName(name?: string | null): string {
  const normalized = name?.trim()
  if (!normalized) return "ME"
  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase()
}

function DashboardAvatar({
  role,
  userInitials,
}: {
  role: "assistant" | "user"
  userInitials: string
}) {
  if (role === "assistant") {
    return (
      <div className={cn("relative shrink-0 overflow-hidden", CHAT_AVATAR_SIZE_CLASS)}>
        <Image
          src={robotAvatar}
          alt="ARSE avatar"
          fill
          sizes="(max-width: 640px) 24px, 32px"
          className="object-cover"
        />
      </div>
    )
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-arse-black bg-transparent font-arse-title font-bold uppercase text-arse-black sm:border-2",
        CHAT_AVATAR_SIZE_CLASS,
        CHAT_AVATAR_TEXT_CLASS
      )}
    >
      {userInitials}
    </div>
  )
}

export function MessageBubble({
  message,
  citationDocuments,
  segmentPersonas,
  userName,
}: {
  message: ChatMessage
  /** When set, citation indices merge document colors for inline + tooltip UI. */
  citationDocuments?: CitationDocumentRef[]
  /** Resolved persona list; drives segment-badge colors in `[4]` interview citations. */
  segmentPersonas?: PersonaMock[]
  userName?: string | null
}) {
  const isUser = message.role === "user"
  const isCancelledNotice = !isUser && message.content.trim() === "Cancelled."
  const userInitials = initialsFromName(userName)
  const mergedCitations = useMemo(() => {
    const docs = citationDocuments ?? []
    const colors = mergeCitationSourcesWithDocColors(message.citations ?? [], docs)
    return mergeCitationSourcesWithDocIcons(colors, docs)
  }, [message.citations, citationDocuments])
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
      children,
      ...props
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
                variant="compact"
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
                className={citationTooltipContentClass("compact", source.citeColorToken, source)}
                style={citationTooltipContentStyle(source.citeColorToken)}
              >
                <CitationTooltipBody
                  source={source}
                  primaryLabel={primaryLabel}
                  variant="compact"
                  inlineCitation={inlineCitation}
                  segmentPersonas={segmentPersonas}
                />
              </TooltipContent>
            </Tooltip>
          )
        }
      }
      return (
        <a
          {...props}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className={externalMarkdownLinkClass("dashboard", isUser)}
        >
          {children}
        </a>
      )
    }

    return buildChatMarkdownComponents("dashboard", linkRenderer, { isUser })
  }, [citationSourcesByIndex, isUser, message.content, message.inlineCitations, segmentPersonas])

  const markdownShell = chatMarkdownProseClass({
    variant: "dashboard",
    isUser,
    isCancelledNotice,
  })

  const chatRole = isUser ? "user" : "assistant"

  return (
    <div
      className={cn(
        "flex w-full min-w-0",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          CHAT_BUBBLE_MAX_WIDTH_CLASS,
          "space-y-1",
          isUser ? "flex flex-col items-end" : "flex flex-col items-start"
        )}
      >
        <ChatMessageRow
          role={chatRole}
          avatar={<DashboardAvatar role={chatRole} userInitials={userInitials} />}
        >
          <div
            className={cn(
              "rounded-2xl px-4 text-sm leading-[1.7]",
              isUser
                ? "ml-auto w-fit max-w-full rounded-br-md bg-dark-950 py-3 text-white sm:ml-0 sm:w-full"
                : cn(
                    "w-full rounded-bl-md bg-background text-foreground",
                    isCancelledNotice ? "py-2" : "py-5 sm:py-6"
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
                    tooltipVariant="compact"
                    messageContent={message.content}
                    inlineCitations={message.inlineCitations}
                    segmentPersonas={segmentPersonas}
                  />
                ) : null}
              </TooltipProvider>
            </div>
          </div>
        </ChatMessageRow>
        <p
          className={cn(
            "text-xs text-muted-foreground",
            isUser ? "text-right" : "text-left"
          )}
        >
          {formatLocalTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}
