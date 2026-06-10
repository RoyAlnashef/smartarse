"use client"

import { useMemo, type AnchorHTMLAttributes, type ReactNode } from "react"
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

function citationIndexFromText(value: string): number | null {
  const match = value.trim().match(/^\[(\d+)\]$/)
  if (!match) return null
  const index = Number(match[1])
  if (!Number.isInteger(index) || index < 1) return null
  return index
}

function textFromReactChildren(children: ReactNode): string {
  if (typeof children === "string") return children
  if (typeof children === "number") return String(children)
  if (Array.isArray(children)) {
    return children.map((child) => textFromReactChildren(child)).join("")
  }
  if (children && typeof children === "object" && "props" in children) {
    const node = children as { props?: { children?: ReactNode } }
    return textFromReactChildren(node.props?.children)
  }
  return ""
}

function initialsFromName(name?: string | null): string {
  const normalized = name?.trim()
  if (!normalized) return "ME"
  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase()
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

  const markdownShell = cn(
    "min-w-0 break-words text-sm leading-[1.7] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
    "[&_p]:my-5 [&_ul]:my-5 [&_ol]:my-5 [&_li]:my-2 [&_li]:leading-relaxed",
    "[&_ul]:space-y-2 [&_ol]:space-y-2",
    "[&_h1]:mb-3 [&_h1]:mt-8 [&_h1]:first:mt-0 [&_h1]:text-lg [&_h1]:font-semibold",
    "[&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:first:mt-0 [&_h2]:text-base [&_h2]:font-semibold",
    "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:first:mt-0 [&_h3]:text-sm [&_h3]:font-semibold",
    "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:italic",
    "[&_blockquote_p]:my-0 [&_blockquote_p+p]:mt-2",
    "[&_a]:underline [&_a]:underline-offset-2",
    "[&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em]",
    "[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4",
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
    "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse",
    "[&_th]:border [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold",
    "[&_td]:border [&_td]:px-2 [&_td]:py-1.5",
    "[&_hr]:my-8 [&_hr]:border-t",
    isUser
      ? cn(
          "[&_blockquote]:border-white/35 [&_blockquote]:text-white/90",
          "[&_a]:text-arse-cyan [&_a]:decoration-arse-cyan/50 hover:[&_a]:decoration-arse-cyan",
          "[&_code]:bg-white/15 [&_code]:text-white",
          "[&_pre]:bg-black/40 [&_pre]:text-white",
          "[&_th]:border-white/20 [&_td]:border-white/20",
          "[&_hr]:border-white/25",
        )
      : cn(
          "[&_blockquote]:border-foreground/25",
          "[&_a]:decoration-arse-pink/60 hover:[&_a]:decoration-arse-pink",
          "[&_code]:bg-muted",
          "[&_pre]:bg-foreground [&_pre]:text-background",
          "[&_th]:border-border [&_td]:border-border",
          "[&_hr]:border-border",
        ),
    isCancelledNotice && "[&_p]:my-0 leading-normal",
  )

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="relative h-8 w-8 shrink-0 overflow-hidden">
          <Image
            src={robotAvatar}
            alt="ARSE avatar"
            fill
            sizes="32px"
            className="object-cover"
          />
        </div>
      )}

      <div className={`max-w-[75%] space-y-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={cn(
            "rounded-2xl px-4 text-sm leading-[1.7]",
            isUser
              ? "rounded-br-md bg-dark-950 py-3 text-white"
              : cn(
                  "rounded-bl-md bg-background text-foreground",
                  isCancelledNotice ? "py-2" : "py-5 sm:py-6"
                ),
          )}
        >
          <div className={markdownShell}>
            <TooltipProvider delayDuration={120}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node: _node, href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown }) => {
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
                      <a {...props} href={href} target="_blank" rel="noreferrer noopener">
                        {children}
                      </a>
                    )
                  },
                }}
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
        <p
          className={`text-xs text-muted-foreground ${isUser ? "text-right" : "text-left"}`}
        >
          {formatLocalTime(message.timestamp)}
        </p>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-arse-black bg-transparent font-arse-title text-[10px] font-bold uppercase text-arse-black">
          {userInitials}
        </div>
      )}
    </div>
  )
}
