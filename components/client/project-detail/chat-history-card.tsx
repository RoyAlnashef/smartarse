"use client"

import { Loader2 } from "lucide-react"
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react"
import type {
  HistoryItem as ChatHistoryRow,
  HistoryResponse,
} from "@/lib/chat-history-types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ChatHistoryCardProps = {
  items: ChatHistoryRow[]
  pagination: HistoryResponse["pagination"] | null
  page: number
  loading: boolean
  onFetchPage: (targetPage: number) => void
  /** Load thread in the main pane (no automatic re-query). */
  onHistoryItemSelect?: (item: ChatHistoryRow) => void | Promise<void>
  /** Show spinner on the row being hydrated. */
  loadingRequestId?: string | null
  /** Highlight the active conversation anchor. */
  selectedRequestId?: string | null
  /** Block history clicks (e.g. while a chat request is in flight). */
  disableSelect?: boolean
  className?: string
}

export function ChatHistoryCard({
  items,
  pagination,
  page,
  loading,
  onFetchPage,
  onHistoryItemSelect,
  loadingRequestId,
  selectedRequestId,
  disableSelect = false,
  className,
}: ChatHistoryCardProps) {
  const [internalBusy, setInternalBusy] = useState(false)
  const prevItemsKeyRef = useRef("")

  const enteringItemIds = useMemo(() => {
    const key = items.map((i) => i.request_id).join(",")
    const prev = prevItemsKeyRef.current
    if (prev === "") {
      prevItemsKeyRef.current = key
      return new Set<string>()
    }
    if (prev === key) {
      return new Set<string>()
    }
    const prevIds = new Set(prev.split(",").filter(Boolean))
    const added = new Set(
      items.filter((i) => !prevIds.has(i.request_id)).map((i) => i.request_id),
    )
    prevItemsKeyRef.current = key
    return added
  }, [items])

  const handleSelect = useCallback(
    async (item: ChatHistoryRow) => {
      if (disableSelect || loading || loadingRequestId != null || internalBusy) {
        return
      }
      setInternalBusy(true)
      try {
        await onHistoryItemSelect?.(item)
      } finally {
        setInternalBusy(false)
      }
    },
    [
      disableSelect,
      loading,
      loadingRequestId,
      internalBusy,
      onHistoryItemSelect,
    ],
  )

  const totalPages = pagination?.totalPages ?? 1
  const showPagination = totalPages > 1
  const canPrev = page > 1 && !loading
  const canNext = page < totalPages && !loading
  const selectBlocked =
    disableSelect || loading || loadingRequestId != null || internalBusy

  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl bg-dark-950 text-arse-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]",
        className,
      )}
    >
      <div className="bg-arse-pink px-4 py-2 text-center font-arse-title text-xs font-bold tracking-wide text-arse-white">
        Chat History
      </div>
      <div className="relative px-4 py-4">
        {loading ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-b-3xl bg-dark-950/60"
            aria-busy="true"
            aria-live="polite"
          >
            <Loader2
              className="h-6 w-6 animate-spin text-arse-cyan"
              aria-hidden
            />
            <span className="sr-only">Loading chat history</span>
          </div>
        ) : null}

        <div className="space-y-0">
          {items.length === 0 && !loading ? (
            <p className="text-left font-arse-body text-sm leading-relaxed text-arse-white/75">
              Ask smartARSE a question to start your first chat.
            </p>
          ) : (
            items.map((item) => {
              const animateEnter = enteringItemIds.has(item.request_id)
              const rowLoading = loadingRequestId === item.request_id
              const isSelected = selectedRequestId === item.request_id
              return (
                <button
                  key={item.request_id}
                  type="button"
                  disabled={selectBlocked}
                  onClick={() => void handleSelect(item)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition-colors",
                    "font-arse-body text-xs font-semibold leading-snug",
                    "text-arse-white hover:text-arse-cyan",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950",
                    selectBlocked &&
                      "cursor-not-allowed opacity-60 text-arse-white/45 hover:text-arse-white/45",
                    rowLoading && "opacity-100 text-arse-cyan",
                    isSelected &&
                      !selectBlocked &&
                      "bg-arse-cyan/15 text-arse-cyan ring-1 ring-arse-cyan/35",
                    animateEnter &&
                      "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-4 motion-safe:duration-300 motion-safe:ease-out",
                    animateEnter &&
                      "motion-reduce:animate-none motion-reduce:opacity-100",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-left">
                    {item.user_query}
                  </span>
                  {rowLoading ? (
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin text-arse-cyan"
                      aria-hidden
                    />
                  ) : null}
                </button>
              )
            })
          )}
        </div>

        {showPagination ? (
          <div className="mt-4 flex items-center justify-between gap-2 font-arse-body text-xs text-arse-white/70">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!canPrev}
              onClick={() => onFetchPage(page - 1)}
              className="h-8 rounded-lg border-arse-cyan/15 bg-arse-cyan/10 font-arse-title text-[10px] font-bold tracking-wide text-arse-cyan hover:text-arse-white hover:bg-arse-cyan/18"
            >
              Previous
            </Button>
            <span className="tabular-nums text-arse-white/70">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!canNext}
              onClick={() => onFetchPage(page + 1)}
              className="h-8 rounded-lg border-arse-cyan/15 bg-arse-cyan/10 font-arse-title text-[10px] font-bold tracking-wide text-arse-cyan hover:text-arse-white hover:bg-arse-cyan/18"
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
