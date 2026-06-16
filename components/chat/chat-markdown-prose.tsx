"use client"

import type { Components } from "react-markdown"
import type { AnchorHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export type ChatMarkdownVariant = "client" | "dashboard"

/** Bubble width accounting for one 32px avatar + 12px flex gap. */
export const CHAT_BUBBLE_MAX_WIDTH_CLASS =
  "max-w-[min(42rem,calc(100%-2.75rem))] min-w-0 shrink"

type ProseOptions = {
  variant: ChatMarkdownVariant
  isUser?: boolean
  isCancelledNotice?: boolean
}

function tableBorderClass(variant: ChatMarkdownVariant, isUser?: boolean): string {
  if (variant === "client") return "border-arse-black/20"
  return isUser ? "border-white/20" : "border-border"
}

function cellBorderClass(variant: ChatMarkdownVariant, isUser?: boolean): string {
  if (variant === "client") return "border-arse-black/20"
  return isUser ? "border-white/20" : "border-border"
}

/** External markdown link classes (non-citation anchors). */
export function externalMarkdownLinkClass(
  variant: ChatMarkdownVariant,
  isUser?: boolean
): string {
  if (variant === "client") {
    return cn(
      "break-all underline underline-offset-2 decoration-arse-pink/60 hover:decoration-arse-pink"
    )
  }
  if (isUser) {
    return cn(
      "break-all text-arse-cyan underline underline-offset-2 decoration-arse-cyan/50 hover:decoration-arse-cyan"
    )
  }
  return cn(
    "break-all underline underline-offset-2 decoration-arse-pink/60 hover:decoration-arse-pink"
  )
}

export function chatMarkdownProseClass({
  variant,
  isUser = false,
  isCancelledNotice = false,
}: ProseOptions): string {
  return cn(
    "min-w-0 overflow-hidden break-words text-sm leading-[1.7] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
    "[&_p]:my-5 [&_ul]:my-5 [&_ol]:my-5 [&_li]:my-2 [&_li]:leading-relaxed",
    "[&_ul]:space-y-2 [&_ol]:space-y-2",
    "[&_h1]:mb-3 [&_h1]:mt-8 [&_h1]:first:mt-0 [&_h1]:text-lg [&_h1]:font-semibold",
    "[&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:first:mt-0 [&_h2]:text-base [&_h2]:font-semibold",
    "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:first:mt-0 [&_h3]:text-sm [&_h3]:font-semibold",
    "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:italic",
    "[&_blockquote_p]:my-0 [&_blockquote_p+p]:mt-2",
    "[&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em]",
    "[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4",
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
    "[&_hr]:my-8 [&_hr]:border-t",
    variant === "client"
      ? cn(
          "[&_blockquote]:border-arse-black/30",
          "[&_code]:bg-arse-black/10",
          "[&_pre]:bg-arse-black/90 [&_pre]:text-arse-white",
          "[&_hr]:border-arse-black/15"
        )
      : isUser
        ? cn(
            "[&_blockquote]:border-white/35 [&_blockquote]:text-white/90",
            "[&_code]:bg-white/15 [&_code]:text-white",
            "[&_pre]:bg-black/40 [&_pre]:text-white",
            "[&_hr]:border-white/25"
          )
        : cn(
            "[&_blockquote]:border-foreground/25",
            "[&_code]:bg-muted",
            "[&_pre]:bg-foreground [&_pre]:text-background",
            "[&_hr]:border-border"
          ),
    isCancelledNotice && "[&_p]:my-0 leading-normal"
  )
}

type LinkRenderer = NonNullable<Components["a"]>

export function buildChatMarkdownComponents(
  variant: ChatMarkdownVariant,
  linkRenderer: LinkRenderer,
  options?: { isUser?: boolean }
): Components {
  const isUser = options?.isUser ?? false
  const shellBorder = tableBorderClass(variant, isUser)
  const cellBorder = cellBorderClass(variant, isUser)

  return {
    table: ({ children }) => (
      <div className={cn("my-6 overflow-hidden rounded-lg border", shellBorder)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-sm">{children}</table>
        </div>
      </div>
    ),
    th: ({ children }) => (
      <th
        className={cn(
          "border px-2 py-1.5 text-left text-xs font-semibold sm:text-sm",
          cellBorder
        )}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className={cn("border px-2 py-1.5 text-xs sm:text-sm", cellBorder)}>
        {children}
      </td>
    ),
    img: ({ src, alt }) => (
      // eslint-disable-next-line @next/next/no-img-element -- markdown may reference arbitrary URLs
      <img src={src} alt={alt ?? ""} className="my-4 h-auto max-w-full rounded-lg" />
    ),
    a: linkRenderer,
  }
}

export type ChatMarkdownProseProps = ProseOptions & {
  className?: string
  children: ReactNode
}

export function ChatMarkdownProse({
  className,
  children,
  ...options
}: ChatMarkdownProseProps) {
  return (
    <div className={cn(chatMarkdownProseClass(options), className)}>{children}</div>
  )
}

export function textFromReactChildren(children: ReactNode): string {
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

export function citationIndexFromText(value: string): number | null {
  const match = value.trim().match(/^\[(\d+)\]$/)
  if (!match) return null
  const index = Number(match[1])
  if (!Number.isInteger(index) || index < 1) return null
  return index
}

export type CitationLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  node?: unknown
}
