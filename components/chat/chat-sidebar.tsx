"use client"

import { Info, MessageSquare, RotateCw } from "lucide-react"
import { useMemo } from "react"
import type { Conversation, SavedCustomAudience } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { PersonaMock } from "@/lib/personas/segment-mocks"
import {
  personaSegmentActiveRowClass,
  personaSegmentDotClass,
} from "@/lib/theme/persona-segment-theme"
import { chatHistoryPrimaryPersonaColorToken } from "@/lib/theme/custom-audience-dominant-persona"
import {
  findSavedCustomAudienceForChatHistoryRow,
  resolvedChatHistoryAudienceStackTokens,
} from "@/lib/theme/custom-audience-display-tokens"
import {
  citeColorDotFillStyle,
  isCiteColorDotFillToken,
} from "@/lib/theme/cite-color-tokens"
import { formatLocalDate } from "@/lib/datetime"
import { cn } from "@/lib/utils"

function ChatSidebarEmptySkeleton() {
  const rows = [0, 1, 2, 3] as const
  const titleWidths = ["w-[min(100%,11rem)]", "w-[min(100%,9rem)]", "w-[min(100%,12rem)]", "w-[min(100%,8rem)]"] as const
  return (
    <div className="flex flex-col gap-3">
      <Alert
        className="border-cyan-200 bg-cyan-50/90 py-3 pl-3 pr-2 [&>svg]:left-3 [&>svg]:top-3.5 [&>svg]:text-cyan-700 [&>svg~*]:pl-6"
        role="status"
      >
        <Info className="h-4 w-4 shrink-0" aria-hidden />
        <AlertDescription className="text-xs leading-snug text-foreground/90">
          Your client hasn&apos;t started talking to smartA.R.S.E. yet.
        </AlertDescription>
      </Alert>
      <div className="space-y-2" aria-hidden>
        {rows.map((i) => (
          <div
            key={i}
            className="flex w-full flex-col gap-1 rounded-lg px-3 py-3"
          >
            <Skeleton className={`h-4 max-w-full ${titleWidths[i]}`} />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-[4.25rem]" />
              <Skeleton className="h-3 w-11" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export type ChatSidebarConversationMeta = {
  userLabel?: string
  /** Discriminator. When `"focus_group"`, this row collapses an entire session. */
  chatContextMode?: string | null
  personaSegmentId?: string | null
  personaSegmentName?: string | null
  personaSegmentColorToken?: string | null
  customAudienceId?: string | null
  customAudienceName?: string | null
  customAudienceChildSegmentIds?: string[] | null
  customAudienceChildSegmentColorTokens?: string[] | null
  /** Set only on focus-group entries; matches `focus_group_sessions.id`. */
  focusGroupSessionId?: string | null
  focusGroupRoundCount?: number | null
  focusGroupParticipantCount?: number | null
  /** Per-participant color tokens in speaking order. */
  focusGroupParticipantColorTokens?: string[] | null
}

/**
 * Two-line tooltip body shared by every chat-history entry: small uppercase
 * label + value. Visual parity with `HistoryTooltipBody` in
 * `components/client/project-detail/chat-history-card.tsx`.
 */
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

function sidebarRowHasSegmentOrAudience(
  meta: ChatSidebarConversationMeta | undefined
): boolean {
  if (!meta) return false
  if (meta.personaSegmentId?.trim()) return true
  if (meta.personaSegmentName?.trim()) return true
  if (meta.customAudienceId?.trim()) return true
  if (meta.customAudienceName?.trim()) return true
  const childIds = meta.customAudienceChildSegmentIds ?? []
  return childIds.some((id) => Boolean(id?.trim()))
}

/** Plain chat (no segment / audience) on the light dashboard rail. */
const CHAT_SIDEBAR_DEFAULT_DOT_CLASS =
  "border border-border bg-background shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"

export function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onReloadHistory,
  reloadDisabled = false,
  isLoading = false,
  emptyState = "default",
  metaByConversationId,
  errorMessage,
  resolvedSegmentPersonas,
  savedCustomAudiences,
}: {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  /** Reloads the entire chat-history list (acts like a page reload for chats). */
  onReloadHistory?: () => void
  reloadDisabled?: boolean
  isLoading?: boolean
  emptyState?: "default" | "skeleton"
  metaByConversationId?: Record<string, ChatSidebarConversationMeta>
  errorMessage?: string | null
  /** Live persona segment bindings (admin project personas). */
  resolvedSegmentPersonas?: PersonaMock[] | null
  /** Saved custom audiences for stack parity with client chat history. */
  savedCustomAudiences?: SavedCustomAudience[] | null
}) {
  const savedAudiencesById = useMemo(() => {
    const m = new Map<string, SavedCustomAudience>()
    for (const row of savedCustomAudiences ?? []) {
      m.set(row.id, row)
    }
    return m
  }, [savedCustomAudiences])

  return (
    <div className="flex min-h-0 h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chat History
          </h3>
          {onReloadHistory ? (
            <button
              type="button"
              onClick={onReloadHistory}
              disabled={reloadDisabled}
              aria-label="Reload chat history"
              title="Reload chat history"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCw className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {errorMessage ? (
          <Alert
            className="mb-2 border-rose-200 bg-rose-50/90 py-2 [&>svg~*]:pl-3"
            role="alert"
          >
            <AlertDescription className="text-xs text-rose-900">
              {errorMessage}
            </AlertDescription>
          </Alert>
        ) : null}
        {conversations.length === 0 &&
          (emptyState === "skeleton" ? (
            isLoading ? (
              <ChatSidebarEmptySkeleton />
            ) : (
              <div className="px-3 py-8 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">No chat history yet</p>
                <p className="text-xs text-muted-foreground">Start by asking a question</p>
              </div>
            )
          ) : (
            <div className="px-3 py-8 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">No chat history yet</p>
              <p className="text-xs text-muted-foreground">Start by asking a question</p>
            </div>
          ))}
        {conversations.map((conv) => {
          const meta = metaByConversationId?.[conv.id]
          const isFocusGroup = meta?.chatContextMode === "focus_group"

          if (isFocusGroup) {
            const participantCount =
              meta?.focusGroupParticipantCount ??
              meta?.focusGroupParticipantColorTokens?.length ??
              0
            const roundCount = meta?.focusGroupRoundCount ?? 0
            const tokens = (
              meta?.focusGroupParticipantColorTokens ?? []
            ).slice(0, 4)
            const focusGroupPrimaryToken = tokens[0] ?? null
            const tooltipValue =
              `${participantCount || "?"} participant${participantCount === 1 ? "" : "s"}` +
              ` \u00b7 ${roundCount || "?"} round${roundCount === 1 ? "" : "s"}`
            return (
              <TooltipProvider key={conv.id} delayDuration={120}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSelect(conv.id)}
                      className={`flex w-full flex-col gap-1 rounded-lg px-3 py-3 text-left transition-colors ${
                        activeId === conv.id
                          ? personaSegmentActiveRowClass(focusGroupPrimaryToken)
                          : "hover:bg-muted"
                      }`}
                    >
                      <p className="truncate text-sm font-medium text-foreground">
                        {conv.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {meta?.userLabel ? (
                          <>
                            {tokens.length > 1 ? (
                              <span className="inline-flex shrink-0 -space-x-1" aria-hidden>
                                {tokens.map((token, index) => (
                                  <span
                                    key={`${conv.id}-${token}-${index}`}
                                    className={cn(
                                      "h-2.5 w-2.5 rounded-full border border-background",
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
                                  "h-2.5 w-2.5 shrink-0 rounded-full",
                                  tokens.length === 1
                                    ? cn(
                                        "border border-background",
                                        !isCiteColorDotFillToken(focusGroupPrimaryToken) &&
                                          personaSegmentDotClass(focusGroupPrimaryToken)
                                      )
                                    : CHAT_SIDEBAR_DEFAULT_DOT_CLASS
                                )}
                                style={
                                  tokens.length === 1
                                    ? citeColorDotFillStyle(focusGroupPrimaryToken)
                                    : undefined
                                }
                              />
                            )}
                            <span className="truncate">{meta.userLabel}</span>
                            <span>{"/"}</span>
                          </>
                        ) : (
                          <>
                            <span>{conv.messageCount} messages</span>
                            <span>{"/"}</span>
                          </>
                        )}
                        <span>{formatLocalDate(conv.lastMessageAt, { day: "numeric", month: "short" })}</span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-56 border-dark-800 bg-dark-950 px-3 py-2 shadow-lg"
                  >
                    <HistoryTooltipBody label="Focus group" value={tooltipValue} />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          }

          const hasContext = sidebarRowHasSegmentOrAudience(meta)
          const historyLike = {
            persona_segment_id: meta?.personaSegmentId ?? null,
            persona_segment_name: meta?.personaSegmentName ?? null,
            persona_segment_color_token: meta?.personaSegmentColorToken ?? null,
            custom_audience_id: meta?.customAudienceId ?? null,
            custom_audience_name: meta?.customAudienceName ?? null,
            custom_audience_child_segment_ids:
              meta?.customAudienceChildSegmentIds ?? null,
            custom_audience_child_segment_color_tokens:
              meta?.customAudienceChildSegmentColorTokens ?? null,
          }
          const stackTokens = resolvedChatHistoryAudienceStackTokens(
            historyLike,
            savedAudiencesById,
            resolvedSegmentPersonas
          )
          const savedForRow = findSavedCustomAudienceForChatHistoryRow(
            historyLike,
            savedAudiencesById
          )
          const effectiveChildSegmentIds =
            savedForRow?.snapshot.childSegments.length
              ? savedForRow.snapshot.childSegments.map((s) => s.id)
              : meta?.customAudienceChildSegmentIds
          const rowColorToken = hasContext
            ? chatHistoryPrimaryPersonaColorToken({
                customAudienceName: meta?.customAudienceName,
                customAudienceChildSegmentIds: effectiveChildSegmentIds,
                customAudienceChildSegmentColorTokens: stackTokens,
                personaSegmentColorToken: meta?.personaSegmentColorToken,
                resolvedSegmentPersonas,
              }) ??
              stackTokens[0] ??
              null
            : null
          const audienceName = meta?.customAudienceName?.trim() || null
          const segmentName = meta?.personaSegmentName?.trim() || null
          const tooltipLabel = audienceName
            ? "Audience"
            : segmentName
              ? "Segment"
              : "Agent"
          const tooltipValue = audienceName || segmentName || "smartA.R.S.E."
          return (
            <TooltipProvider key={conv.id} delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelect(conv.id)}
                    className={`flex w-full flex-col gap-1 rounded-lg px-3 py-3 text-left transition-colors ${
                      activeId === conv.id
                        ? personaSegmentActiveRowClass(rowColorToken)
                        : "hover:bg-muted"
                    }`}
                  >
                    <p className="truncate text-sm font-medium text-foreground">{conv.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {meta?.userLabel ? (
                        <>
                          {hasContext && stackTokens.length > 1 ? (
                            <span className="inline-flex shrink-0 -space-x-1" aria-hidden>
                              {stackTokens.slice(0, 4).map((token, index) => (
                                <span
                                  key={`${conv.id}-${token}-${index}`}
                                  className={cn(
                                    "h-2.5 w-2.5 rounded-full border border-background",
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
                                "h-2.5 w-2.5 shrink-0 rounded-full",
                                hasContext
                                  ? cn(
                                      "border border-background",
                                      !isCiteColorDotFillToken(rowColorToken) &&
                                        personaSegmentDotClass(rowColorToken)
                                    )
                                  : CHAT_SIDEBAR_DEFAULT_DOT_CLASS
                              )}
                              style={
                                hasContext
                                  ? citeColorDotFillStyle(rowColorToken)
                                  : undefined
                              }
                            />
                          )}
                          <span className="truncate">{meta.userLabel}</span>
                          <span>{"/"}</span>
                        </>
                      ) : (
                        <>
                          <span>{conv.messageCount} messages</span>
                          <span>{"/"}</span>
                        </>
                      )}
                      <span>{formatLocalDate(conv.lastMessageAt, { day: "numeric", month: "short" })}</span>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-56 border-dark-800 bg-dark-950 px-3 py-2 shadow-lg"
                >
                  <HistoryTooltipBody label={tooltipLabel} value={tooltipValue} />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    </div>
  )
}
