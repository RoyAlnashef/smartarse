"use client"

import { Loader2 } from "lucide-react"
import type { HistoryItem as ChatHistoryRow } from "@/lib/chat-history-types"
import { cn } from "@/lib/utils"

export type HistoryItemProps = {
  item: ChatHistoryRow
  /** Invoked with the full row so parents can read `user_query` and `id`. */
  onRerun: (item: ChatHistoryRow) => void
  isRerunning: boolean
  /** When re-run is in flight, spinner shows on this row only. */
  isActiveRow?: boolean
  /** Play enter animation (e.g. row just added to the list). */
  animateEnter?: boolean
}

export function HistoryItem({
  item,
  onRerun,
  isRerunning,
  isActiveRow = false,
  animateEnter = false,
}: HistoryItemProps) {
  return (
    <button
      type="button"
      disabled={isRerunning}
      onClick={() => onRerun(item)}
      className={cn(
        "group flex w-full gap-2 rounded-lg border border-transparent px-1 pb-1 text-left",
        "font-arse-body text-sm leading-snug text-arse-black/100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink/35 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        isRerunning && "cursor-not-allowed opacity-60",
        isActiveRow && isRerunning && "opacity-100",
        animateEnter &&
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-10 motion-safe:duration-[600ms] motion-safe:ease-out",
        animateEnter && "motion-reduce:animate-none motion-reduce:opacity-100",
      )}
    >
      <span
        className={cn(
          "line-clamp-1 min-w-0 flex-1 transition-colors",
          "group-hover:text-arse-pink group-hover:underline group-hover:decoration-arse-pink group-hover:decoration-2 group-hover:underline-offset-2",
        )}
      >
        {item.user_query}
      </span>
      {isRerunning && isActiveRow ? (
        <Loader2
          className="h-4 w-4 shrink-0 animate-spin text-arse-pink"
          aria-hidden
        />
      ) : null}
    </button>
  )
}
