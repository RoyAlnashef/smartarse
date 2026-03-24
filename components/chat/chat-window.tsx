"use client"

import { useRef, useEffect } from "react"
import { MessageSquare } from "lucide-react"
import type { ChatMessage } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageBubble } from "./message-bubble"

function ChatWindowEmptySkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white p-8">
      <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
      <Skeleton className="mt-4 h-6 w-[min(100%,14rem)] max-w-sm" />
      <Skeleton className="mt-2 h-4 w-full max-w-sm" />
      <Skeleton className="mt-2 h-4 w-[min(100%,18rem)] max-w-sm" />
    </div>
  )
}

export function ChatWindow({
  messages,
  isTyping,
  emptyState = "default",
}: {
  messages: ChatMessage[]
  isTyping?: boolean
  emptyState?: "default" | "skeleton"
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  if (messages.length === 0) {
    if (emptyState === "skeleton") {
      return <ChatWindowEmptySkeleton />
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-white p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Start a conversation</h3>
        <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
          Ask questions about your project research data. The AI will use your project documents to provide answers.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto bg-white p-4 lg:p-6">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-950 text-xs font-bold text-mint-300">
            D
          </div>
          <div className="rounded-2xl rounded-bl-md bg-background px-4 py-3">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-dark-300" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-dark-300" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-dark-300" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
