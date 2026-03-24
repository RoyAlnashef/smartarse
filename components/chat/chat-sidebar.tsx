"use client"

import { MessageSquare } from "lucide-react"
import type { Conversation } from "@/lib/types"

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
}: {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Chat History
        </h3>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {conversations.length === 0 && (
          <div className="px-3 py-8 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">No chat history yet</p>
            <p className="text-xs text-muted-foreground">Start by asking a question</p>
          </div>
        )}
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors ${
              activeId === conv.id
                ? "bg-mint-50 ring-1 ring-mint-300"
                : "hover:bg-muted"
            }`}
          >
            <p className="truncate text-sm font-medium text-foreground">{conv.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{conv.messageCount} messages</span>
              <span>{"/"}</span>
              <span>{formatDate(conv.lastMessageAt)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
