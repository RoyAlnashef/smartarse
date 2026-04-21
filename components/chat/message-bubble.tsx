"use client"

import { useMemo, type AnchorHTMLAttributes, type ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ChatCitationSource, ChatMessage } from "@/lib/types"
import {
  citationSourcePrimaryLabel,
  citationSourceTooltipLabel,
} from "@/lib/documents/display-label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const CITATION_HREF_PREFIX = "citation://"

function citationHref(index: number): string {
  return `${CITATION_HREF_PREFIX}${index}`
}

function citationIndexFromHref(href: string | undefined): number | null {
  if (!href || !href.startsWith(CITATION_HREF_PREFIX)) return null
  const value = Number(href.slice(CITATION_HREF_PREFIX.length))
  if (!Number.isInteger(value) || value < 1) return null
  return value
}

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

function rewriteInlineCitationMarkers(
  markdown: string,
  sourcesByIndex: Map<number, ChatCitationSource>
): string {
  if (!markdown || sourcesByIndex.size === 0) return markdown
  return markdown.replace(/\[(\d+)\](?!\()/g, (fullMatch, indexRaw: string) => {
    const index = Number(indexRaw)
    if (!sourcesByIndex.has(index)) return fullMatch
    return `[\\[${index}\\]](${citationHref(index)})`
  })
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"
  const citationSourcesByIndex = useMemo(() => {
    const map = new Map<number, ChatCitationSource>()
    for (const source of message.citations ?? []) {
      map.set(source.index, source)
    }
    return map
  }, [message.citations])

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
  )

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-950 text-xs font-bold text-arse-cyan">
          D
        </div>
      )}

      <div className={`max-w-[75%] space-y-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={cn(
            "rounded-2xl px-4 text-sm leading-[1.7]",
            isUser
              ? "rounded-br-md bg-dark-950 py-3 text-white"
              : "rounded-bl-md bg-background py-5 text-foreground sm:py-6",
          )}
        >
          <div className={markdownShell}>
            <TooltipProvider delayDuration={120}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node: _node, href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown }) => {
                    const citationIndexFromLink = citationIndexFromHref(href)
                    const citationIndexFromLinkText = citationIndexFromText(
                      textFromReactChildren(children)
                    )
                    const citationIndex = citationIndexFromLink ?? citationIndexFromLinkText
                    if (citationIndex != null) {
                      const source = citationSourcesByIndex.get(citationIndex)
                      if (source) {
                        const primaryLabel = citationSourcePrimaryLabel(source)
                        const tooltipLabel = citationSourceTooltipLabel(source)
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="inline rounded-sm px-0.5 font-semibold text-foreground decoration-arse-pink/70 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink"
                                aria-label={`Citation ${citationIndex}: ${primaryLabel}`}
                              >
                                {children}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="max-w-xs rounded-lg border-2 border-arse-black bg-white px-3 py-2 text-left text-xs text-arse-black"
                            >
                              <p className="font-semibold">{tooltipLabel}</p>
                              {source.excerpt ? (
                                <p className="mt-1 leading-relaxed text-arse-black/75">
                                  {source.excerpt}
                                </p>
                              ) : null}
                              {source.url ? (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="mt-1 inline-block underline decoration-arse-pink/70 underline-offset-2"
                                >
                                  Open source
                                </a>
                              ) : null}
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
            </TooltipProvider>
          </div>
        </div>
        <p
          className={`text-xs text-muted-foreground ${isUser ? "text-right" : "text-left"}`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-arse-cyan/15 text-xs font-semibold text-arse-black">
          You
        </div>
      )}
    </div>
  )
}
