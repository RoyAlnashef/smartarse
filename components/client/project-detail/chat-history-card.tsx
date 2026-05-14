"use client"

import { CardSectionHeaderWithInfoTooltip } from "@/components/client/project-detail/card-section-header-with-info-tooltip"
import { ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react"
import {
  useCallback,
  useEffect,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  personaSegmentActiveTextClass,
  personaSegmentDotClass,
  personaSegmentHoverTextClass,
  personaSegmentTextClass,
} from "@/lib/theme/persona-segment-theme"
import type { SavedCustomAudience } from "@/lib/types"
import { chatHistoryPrimaryPersonaColorToken } from "@/lib/theme/custom-audience-dominant-persona"
import {
  findSavedCustomAudienceForChatHistoryRow,
  resolvedChatHistoryAudienceStackTokens,
} from "@/lib/theme/custom-audience-display-tokens"
import {
  citeColorDotFillStyle,
  isCiteColorDotFillToken,
} from "@/lib/theme/cite-color-tokens"
import type { PersonaMock } from "@/lib/personas/segment-mocks"

const CHAT_HISTORY_INFO_TEXT =
  "Each session is saved into a single chat history in the box below i.e. multiple Q&A's are stored as one chat. Start a new chat if you want conversations saved separately."

/** True when this row was a default chat (no persona segment and no custom audience). */
function historyRowHasSegmentOrAudience(item: ChatHistoryRow): boolean {
  if (item.persona_segment_id?.trim()) return true
  if (item.persona_segment_name?.trim()) return true
  if (item.custom_audience_id?.trim()) return true
  if (item.custom_audience_name?.trim()) return true
  const childIds = item.custom_audience_child_segment_ids ?? []
  return childIds.some((id) => Boolean(id?.trim()))
}

/** Default thread dot: fixed dark ring + inset highlight so hover/active/selected only swap fill (no border-width or ring color change). */
const CHAT_HISTORY_DEFAULT_DOT_CLASS =
  "border border-dark-950 bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"
const CHAT_HISTORY_DEFAULT_DOT_SELECTED_CLASS =
  "border border-dark-950 bg-arse-pink shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"

/** Two-line tooltip body shared by every chat-history entry: small label + value. */
function HistoryTooltipBody({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-arse-title text-[10px] font-bold uppercase tracking-[0.18em] text-arse-white/55">
        {label}:
      </span>
      <span className="font-arse-body text-xs leading-relaxed text-arse-white/95">
        {value}
      </span>
    </div>
  )
}

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
  /** When set, dominant custom-audience segment color follows admin segment bindings. */
  resolvedSegmentPersonas?: PersonaMock[] | null
  /** When set, custom-audience history dots follow the latest saved snapshot (segment count + colors). */
  savedCustomAudiences?: SavedCustomAudience[] | null
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
  resolvedSegmentPersonas,
  savedCustomAudiences,
  className,
}: ChatHistoryCardProps) {
  const [internalBusy, setInternalBusy] = useState(false)
  const [pendingPaginationAction, setPendingPaginationAction] = useState<
    "first" | "prev" | "next" | "last" | null
  >(null)
  const prevItemsKeyRef = useRef("")
  const sawLoadingRef = useRef(false)

  useEffect(() => {
    if (loading) {
      sawLoadingRef.current = true
      return
    }
    if (sawLoadingRef.current) {
      setPendingPaginationAction(null)
      sawLoadingRef.current = false
    }
  }, [loading])

  useEffect(() => {
    setPendingPaginationAction(null)
  }, [page])

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
  const isInitialLoading = loading && items.length === 0
  const isPaginating = loading && items.length > 0
  const paginationDisabled = loading || pendingPaginationAction != null
  const canFirst = page > 1 && !paginationDisabled
  const canPrev = page > 1 && !paginationDisabled
  const canNext = page < totalPages && !paginationDisabled
  const canLast = page < totalPages && !paginationDisabled
  const firstLoading = pendingPaginationAction === "first"
  const prevLoading = pendingPaginationAction === "prev"
  const nextLoading = pendingPaginationAction === "next"
  const lastLoading = pendingPaginationAction === "last"
  const selectBlocked =
    disableSelect || loading || loadingRequestId != null || internalBusy

  const savedAudiencesById = useMemo(() => {
    const m = new Map<string, SavedCustomAudience>()
    for (const row of savedCustomAudiences ?? []) {
      m.set(row.id, row)
    }
    return m
  }, [savedCustomAudiences])

  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl bg-dark-950 text-arse-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]",
        className,
      )}
    >
      <CardSectionHeaderWithInfoTooltip
        title="Chat History"
        tooltipText={CHAT_HISTORY_INFO_TEXT}
      />
      <div className="relative px-4 py-4">
        {isInitialLoading ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-b-3xl bg-dark-950/60"
            aria-busy="true"
            aria-live="polite"
          >
            <Loader2
              className="h-6 w-6 animate-spin text-arse-pink"
              aria-hidden
            />
            <span className="sr-only">Loading chat history</span>
          </div>
        ) : null}

        <div
          className={cn(
            "space-y-0 transition-opacity duration-200",
            isPaginating && "pointer-events-none opacity-60",
          )}
          aria-busy={isPaginating || undefined}
          aria-live={isPaginating ? "polite" : undefined}
        >
          {items.length === 0 && !loading ? (
            <p className="text-left font-arse-body text-sm leading-relaxed text-arse-white/90">
              Ask smartA.R.S.E. your first question about the research data.
            </p>
          ) : (
            items.map((item) => {
              const animateEnter = enteringItemIds.has(item.request_id)
              const rowLoading = loadingRequestId === item.request_id
              const isSelected = selectedRequestId === item.request_id
              const isFocusGroup = item.chat_context_mode === "focus_group"

              if (isFocusGroup) {
                const participantCount =
                  item.focus_group_participant_count ??
                  item.focus_group_participant_color_tokens?.length ??
                  0
                const roundCount = item.focus_group_round_count ?? 0
                const tokens = (
                  item.focus_group_participant_color_tokens ?? []
                ).slice(0, 4)
                const focusGroupTooltipValue =
                  `${participantCount || "?"} participant${participantCount === 1 ? "" : "s"}` +
                  ` · ${roundCount || "?"} round${roundCount === 1 ? "" : "s"}`
                const focusGroupPrimaryToken = tokens[0] ?? null
                return (
                  <TooltipProvider key={item.request_id} delayDuration={120}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          disabled={selectBlocked}
                          onClick={() => void handleSelect(item)}
                          className={cn(
                            "group flex w-full items-start justify-between gap-2 rounded-lg px-1 py-1.5 text-left transition-colors",
                            "font-arse-body text-xs font-semibold leading-snug",
                            "text-arse-white",
                            tokens.length > 0
                              ? cn(
                                  personaSegmentHoverTextClass(focusGroupPrimaryToken),
                                  personaSegmentActiveTextClass(focusGroupPrimaryToken),
                                )
                              : "hover:text-arse-pink active:text-arse-pink",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950",
                            selectBlocked &&
                              "cursor-not-allowed opacity-60 text-arse-white/45 hover:text-arse-white/45 active:text-arse-white/45",
                            rowLoading &&
                              cn(
                                "opacity-100",
                                tokens.length > 0
                                  ? personaSegmentTextClass(focusGroupPrimaryToken)
                                  : "text-arse-pink",
                              ),
                            isSelected &&
                              !selectBlocked &&
                              (tokens.length > 0
                                ? personaSegmentTextClass(focusGroupPrimaryToken)
                                : "text-arse-pink"),
                            animateEnter &&
                              "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-4 motion-safe:duration-300 motion-safe:ease-out",
                            animateEnter &&
                              "motion-reduce:animate-none motion-reduce:opacity-100",
                          )}
                        >
                          <span className="min-w-0 flex-1 pr-1 line-clamp-2 text-left">
                            {item.user_query}
                          </span>
                          <span className="mt-0.5 flex shrink-0 items-center gap-1.5">
                            {tokens.length > 1 ? (
                              <span className="inline-flex shrink-0 -space-x-1" aria-hidden>
                                {tokens.map((token, index) => (
                                  <span
                                    key={`${item.request_id}-${token}-${index}`}
                                    className={cn(
                                      "h-2.5 w-2.5 rounded-full border border-white/20 shadow-sm shadow-black/40 transition-[filter,opacity]",
                                      !selectBlocked &&
                                        "group-hover:brightness-110 group-active:brightness-125",
                                      !isCiteColorDotFillToken(token) &&
                                        personaSegmentDotClass(token)
                                    )}
                                    style={citeColorDotFillStyle(token)}
                                  />
                                ))}
                              </span>
                            ) : (
                              <span
                                aria-hidden
                                className={cn(
                                  "h-2.5 w-2.5 shrink-0 rounded-full transition-colors",
                                  tokens.length === 1
                                    ? cn(
                                        "border border-white/30 shadow-sm shadow-black/40",
                                        !selectBlocked &&
                                          "group-hover:brightness-110 group-active:brightness-125",
                                        !isCiteColorDotFillToken(focusGroupPrimaryToken) &&
                                          personaSegmentDotClass(focusGroupPrimaryToken),
                                      )
                                    : isSelected && !selectBlocked
                                      ? CHAT_HISTORY_DEFAULT_DOT_SELECTED_CLASS
                                      : cn(
                                          CHAT_HISTORY_DEFAULT_DOT_CLASS,
                                          !selectBlocked &&
                                            "group-hover:bg-arse-pink group-active:bg-arse-pink",
                                        )
                                )}
                                style={
                                  tokens.length === 1
                                    ? citeColorDotFillStyle(focusGroupPrimaryToken)
                                    : undefined
                                }
                              />
                            )}
                            {rowLoading ? (
                              <Loader2
                                className={cn(
                                  "h-4 w-4 shrink-0 animate-spin",
                                  tokens.length > 0
                                    ? personaSegmentTextClass(focusGroupPrimaryToken)
                                    : "text-arse-pink",
                                )}
                                aria-hidden
                              />
                            ) : null}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-56 border-dark-800 bg-dark-950 px-3 py-2 shadow-lg"
                      >
                        <HistoryTooltipBody
                          label="Focus group"
                          value={focusGroupTooltipValue}
                        />
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              }

              const hasContext = historyRowHasSegmentOrAudience(item)
              const audienceName = item.custom_audience_name?.trim() || null
              const segmentName = item.persona_segment_name?.trim() || null
              const tooltipLabel = audienceName
                ? "Audience"
                : segmentName
                  ? "Segment"
                  : "Agent"
              const tooltipValue =
                audienceName || segmentName || "smartA.R.S.E."
              const stackTokens = resolvedChatHistoryAudienceStackTokens(
                item,
                savedAudiencesById,
                resolvedSegmentPersonas
              )
              const savedForRow = findSavedCustomAudienceForChatHistoryRow(
                item,
                savedAudiencesById
              )
              const effectiveChildSegmentIds =
                savedForRow?.snapshot.childSegments.length
                  ? savedForRow.snapshot.childSegments.map((s) => s.id)
                  : item.custom_audience_child_segment_ids
              const rowColorToken = hasContext
                ? chatHistoryPrimaryPersonaColorToken({
                    customAudienceName: item.custom_audience_name,
                    customAudienceChildSegmentIds: effectiveChildSegmentIds,
                    customAudienceChildSegmentColorTokens: stackTokens,
                    personaSegmentColorToken: item.persona_segment_color_token,
                    resolvedSegmentPersonas,
                  }) ?? stackTokens[0] ?? null
                : null
              return (
                <TooltipProvider key={item.request_id} delayDuration={120}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        disabled={selectBlocked}
                        onClick={() => void handleSelect(item)}
                        className={cn(
                          "group flex w-full items-start justify-between gap-2 rounded-lg px-1 py-1.5 text-left transition-colors",
                          "font-arse-body text-xs font-semibold leading-snug",
                          "text-arse-white",
                          hasContext
                            ? cn(
                                personaSegmentHoverTextClass(rowColorToken),
                                personaSegmentActiveTextClass(rowColorToken),
                              )
                            : "hover:text-arse-pink active:text-arse-pink",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950",
                          selectBlocked &&
                            "cursor-not-allowed opacity-60 text-arse-white/45 hover:text-arse-white/45 active:text-arse-white/45",
                          rowLoading &&
                            cn(
                              "opacity-100",
                              hasContext
                                ? personaSegmentTextClass(rowColorToken)
                                : "text-arse-pink",
                            ),
                          isSelected &&
                            !selectBlocked &&
                            (hasContext
                              ? personaSegmentTextClass(rowColorToken)
                              : "text-arse-pink"),
                          animateEnter &&
                            "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-4 motion-safe:duration-300 motion-safe:ease-out",
                          animateEnter &&
                            "motion-reduce:animate-none motion-reduce:opacity-100",
                        )}
                      >
                        <span className="min-w-0 flex-1 pr-1 line-clamp-2 text-left">
                          {item.user_query}
                        </span>
                        <span className="mt-0.5 flex shrink-0 items-center gap-1.5">
                          {hasContext && stackTokens.length > 1 ? (
                            <span className="inline-flex shrink-0 -space-x-1" aria-hidden>
                              {stackTokens.slice(0, 4).map((token, index) => (
                                <span
                                  key={`${item.request_id}-${token}-${index}`}
                                  className={cn(
                                    "h-2.5 w-2.5 rounded-full border border-white/20 shadow-sm shadow-black/40 transition-[filter,opacity]",
                                    !selectBlocked &&
                                      "group-hover:brightness-110 group-active:brightness-125",
                                    !isCiteColorDotFillToken(token) &&
                                      personaSegmentDotClass(token)
                                  )}
                                  style={citeColorDotFillStyle(token)}
                                />
                              ))}
                            </span>
                          ) : (
                            <span
                              aria-hidden
                              className={cn(
                                "h-2.5 w-2.5 shrink-0 rounded-full transition-colors",
                                hasContext
                                  ? cn(
                                      "border border-white/30 shadow-sm shadow-black/40",
                                      !selectBlocked &&
                                        "group-hover:brightness-110 group-active:brightness-125",
                                      !isCiteColorDotFillToken(rowColorToken) &&
                                        personaSegmentDotClass(rowColorToken),
                                    )
                                  : isSelected && !selectBlocked
                                    ? CHAT_HISTORY_DEFAULT_DOT_SELECTED_CLASS
                                    : cn(
                                        CHAT_HISTORY_DEFAULT_DOT_CLASS,
                                        !selectBlocked &&
                                          "group-hover:bg-arse-pink group-active:bg-arse-pink",
                                      )
                              )}
                              style={
                                hasContext ? citeColorDotFillStyle(rowColorToken) : undefined
                              }
                            />
                          )}
                          {rowLoading ? (
                            <Loader2
                              className={cn(
                                "h-4 w-4 shrink-0 animate-spin",
                                hasContext
                                  ? personaSegmentTextClass(rowColorToken)
                                  : "text-arse-pink",
                              )}
                              aria-hidden
                            />
                          ) : null}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-56 border-dark-800 bg-dark-950 px-3 py-2 shadow-lg"
                    >
                      <HistoryTooltipBody
                        label={tooltipLabel}
                        value={tooltipValue}
                      />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })
          )}
        </div>

        {showPagination ? (
          <div className="mt-4 flex items-center justify-between gap-1 font-arse-body text-xs text-arse-white/70">
            <div className="flex shrink-0 items-center gap-0.5">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!canFirst}
                      aria-label="Go to first page"
                      onClick={() => {
                        if (pendingPaginationAction != null) return
                        setPendingPaginationAction("first")
                        onFetchPage(1)
                      }}
                      className="h-8 w-8 shrink-0 rounded-md bg-transparent p-0 text-arse-pink hover:bg-transparent hover:text-arse-white disabled:text-arse-white/35 disabled:hover:bg-transparent disabled:hover:text-arse-white/35"
                    >
                      {firstLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <ChevronsLeft className="h-4 w-4" aria-hidden />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="border-dark-800 bg-dark-950 px-2 py-1 shadow-lg"
                  >
                    <span className="font-arse-body text-xs text-arse-white/95">
                      First page
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!canPrev}
                onClick={() => {
                  if (pendingPaginationAction != null) return
                  setPendingPaginationAction("prev")
                  onFetchPage(page - 1)
                }}
                className="h-8 rounded-md bg-transparent px-1 font-arse-title text-[11px] font-bold tracking-wide text-arse-pink underline decoration-arse-pink/70 underline-offset-2 hover:bg-transparent hover:text-arse-white hover:decoration-arse-pink disabled:text-arse-white/35 disabled:no-underline disabled:hover:bg-transparent disabled:hover:text-arse-white/35"
              >
                {prevLoading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Loading...
                  </span>
                ) : (
                  "Previous"
                )}
              </Button>
            </div>
            <span className="tabular-nums text-arse-white/70">
              Page {page} of {totalPages}
            </span>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!canNext}
                onClick={() => {
                  if (pendingPaginationAction != null) return
                  setPendingPaginationAction("next")
                  onFetchPage(page + 1)
                }}
                className="h-8 rounded-md bg-transparent px-1 font-arse-title text-[11px] font-bold tracking-wide text-arse-pink underline decoration-arse-pink/70 underline-offset-2 hover:bg-transparent hover:text-arse-white hover:decoration-arse-pink disabled:text-arse-white/35 disabled:no-underline disabled:hover:bg-transparent disabled:hover:text-arse-white/35"
              >
                {nextLoading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Loading...
                  </span>
                ) : (
                  "Next"
                )}
              </Button>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!canLast}
                      aria-label="Go to last page"
                      onClick={() => {
                        if (pendingPaginationAction != null) return
                        setPendingPaginationAction("last")
                        onFetchPage(totalPages)
                      }}
                      className="h-8 w-8 shrink-0 rounded-md bg-transparent p-0 text-arse-pink hover:bg-transparent hover:text-arse-white disabled:text-arse-white/35 disabled:hover:bg-transparent disabled:hover:text-arse-white/35"
                    >
                      {lastLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <ChevronsRight className="h-4 w-4" aria-hidden />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="border-dark-800 bg-dark-950 px-2 py-1 shadow-lg"
                  >
                    <span className="font-arse-body text-xs text-arse-white/95">
                      Last page
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
