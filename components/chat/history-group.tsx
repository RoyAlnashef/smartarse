"use client"

import { useId } from "react"
import type { HistoryItem as ChatHistoryRow } from "@/lib/chat-history-types"
import { HistoryItem } from "@/components/chat/history-item"
import { cn } from "@/lib/utils"

export type HistoryGroupProps = {
  label: string
  items: ChatHistoryRow[]
  onRerun: (item: ChatHistoryRow) => void
  isRerunning: boolean
  activeItemId?: number | null
  /** Row ids that should play the “new item” enter animation this render. */
  enteringItemIds?: ReadonlySet<number>
  className?: string
}

export function HistoryGroup({
  label,
  items,
  onRerun,
  isRerunning,
  activeItemId = null,
  enteringItemIds,
  className,
}: HistoryGroupProps) {
  const headingId = useId()

  return (
    <section
      className={cn("space-y-2", className)}
      aria-labelledby={headingId}
    >
      <h3
        id={headingId}
        className="px-1.5 py-0.5 rounded-md bg-muted font-arse-title text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </h3>
      <ul className="list-none space-y-0 p-0" role="list">
        {items.map((item) => (
          <li key={item.id}>
            <HistoryItem
              item={item}
              onRerun={onRerun}
              isRerunning={isRerunning}
              isActiveRow={activeItemId === item.id}
              animateEnter={enteringItemIds?.has(item.id) ?? false}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
