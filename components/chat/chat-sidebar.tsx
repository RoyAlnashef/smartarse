"use client"

import { Info, MessageSquare } from "lucide-react"
import type { Conversation } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })
}

export function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  isLoading = false,
  emptyState = "default",
  metaByConversationId,
  errorMessage,
}: {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  isLoading?: boolean
  emptyState?: "default" | "skeleton"
  metaByConversationId?: Record<string, { userLabel?: string }>
  errorMessage?: string | null
}) {
  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Chat History
        </h3>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
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
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`flex w-full flex-col gap-1 rounded-lg px-3 py-3 text-left transition-colors ${
              activeId === conv.id
                ? "bg-arse-cyan/10 ring-1 ring-arse-cyan/40"
                : "hover:bg-muted"
            }`}
          >
            <p className="truncate text-sm font-medium text-foreground">{conv.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {metaByConversationId?.[conv.id]?.userLabel ? (
                <>
                  <span className="truncate">{metaByConversationId[conv.id].userLabel}</span>
                  <span>{"/"}</span>
                </>
              ) : (
                <>
                  <span>{conv.messageCount} messages</span>
                  <span>{"/"}</span>
                </>
              )}
              <span>{formatDate(conv.lastMessageAt)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
