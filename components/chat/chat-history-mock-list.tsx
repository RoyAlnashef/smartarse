"use client"

import { useMemo, useRef, useState, useCallback } from "react"
import type { HistoryItem as ChatHistoryRow } from "@/lib/chat-history-types"
import { HistoryGroup } from "@/components/chat/history-group"
import { groupByDate } from "@/lib/group-by-date"
import { MOCK_CHAT_HISTORY } from "@/lib/mock-chat-history"
import { cn } from "@/lib/utils"

const RERUN_SIM_MS = 600

export type ChatHistoryMockListProps = {
  items?: ChatHistoryRow[]
  /** Fired when a history row is activated (e.g. append user message in main chat). */
  onQuestionSelect?: (question: string) => void
  /** Static pagination strip for layout review (mock only). */
  showMockPagination?: boolean
  className?: string
}

function orderedGroupEntries(groups: Record<string, ChatHistoryRow[]>) {
  const keys = Object.keys(groups)
  const priority = (k: string) => {
    if (k === "Today") return 0
    if (k === "Yesterday") return 1
    return 2
  }
  return [...keys].sort((a, b) => {
    const pa = priority(a)
    const pb = priority(b)
    if (pa !== pb) return pa - pb
    return keys.indexOf(a) - keys.indexOf(b)
  })
}

export function ChatHistoryMockList({
  items = MOCK_CHAT_HISTORY,
  onQuestionSelect,
  showMockPagination = false,
  className,
}: ChatHistoryMockListProps) {
  const [isRerunning, setIsRerunning] = useState(false)
  const [activeItemId, setActiveItemId] = useState<number | null>(null)
  const prevItemsKeyRef = useRef("")

  const enteringItemIds = useMemo(() => {
    const key = items.map((i) => i.id).join(",")
    const prev = prevItemsKeyRef.current
    if (prev === "") {
      prevItemsKeyRef.current = key
      return new Set<number>()
    }
    if (prev === key) {
      return new Set<number>()
    }
    const prevIds = new Set(
      prev.split(",").filter(Boolean).map((s) => Number(s)),
    )
    const added = new Set(
      items.filter((i) => !prevIds.has(i.id)).map((i) => i.id),
    )
    prevItemsKeyRef.current = key
    return added
  }, [items])

  const grouped = useMemo(() => groupByDate(items), [items])
  const groupLabels = useMemo(() => orderedGroupEntries(grouped), [grouped])

  const handleRerun = useCallback(
    (item: ChatHistoryRow) => {
      if (isRerunning) return
      setIsRerunning(true)
      setActiveItemId(item.id)
      onQuestionSelect?.(item.user_query)
      window.setTimeout(() => {
        setIsRerunning(false)
        setActiveItemId(null)
      }, RERUN_SIM_MS)
    },
    [isRerunning, onQuestionSelect],
  )

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 text-center",
          className,
        )}
      >
        <p className="font-arse-title text-xs font-bold uppercase tracking-wide text-arse-black/50">
          Chat history
        </p>
        <p className="mt-3 max-w-[16rem] font-arse-body text-sm leading-relaxed text-arse-black/60">
          No questions yet. Ask something to get started.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        <div className="flex flex-col gap-5">
          {groupLabels.map((label) => (
            <HistoryGroup
              key={label}
              label={label}
              items={grouped[label] ?? []}
              onRerun={handleRerun}
              isRerunning={isRerunning}
              activeItemId={activeItemId}
              enteringItemIds={enteringItemIds}
            />
          ))}
        </div>
      </div>
      {showMockPagination ? (
        <div className="shrink-0 border-t border-arse-black/10 px-3 py-2">
          <div className="flex items-center justify-between gap-2 font-arse-body text-xs text-arse-black/55">
            <button
              type="button"
              disabled
              className="rounded-md px-2 py-1 font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black/35"
            >
              Previous
            </button>
            <span className="tabular-nums">Page 1 of 2</span>
            <button
              type="button"
              disabled
              className="rounded-md px-2 py-1 font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black/35"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
