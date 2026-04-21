"use client"

import { useRef, useEffect } from "react"
import { Bot, Loader2, MessageSquare } from "lucide-react"
import type { ChatMessage } from "@/lib/types"
import { MessageBubble } from "./message-bubble"

function ChatWindowAdminReadOnlyEmpty() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center bg-white p-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center rounded-2xl border border-arse-pink/25 bg-arse-pink-muted text-arse-pink shadow-sm">
        <Bot className="h-12 w-12" strokeWidth={1.5} aria-hidden />
      </div>
      <h3 className="mt-5 max-w-sm text-center text-lg font-semibold text-foreground">
        No client activity <span className="text-arse-pink">yet</span>
      </h3>
      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        You&apos;ll see the conversation here once your client starts asking smartA.R.S.E. questions. Reach out if they
        need help getting started.
      </p>
    </div>
  )
}

function ChatWindowLoadingState() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-3 bg-white p-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-7 w-7 animate-spin text-arse-pink" aria-hidden />
      <p className="text-sm text-muted-foreground">Loading chat…</p>
    </div>
  )
}

export function ChatWindow({
  messages,
  isTyping,
  isLoading = false,
  emptyState = "default",
}: {
  messages: ChatMessage[]
  isTyping?: boolean
  isLoading?: boolean
  emptyState?: "default" | "skeleton"
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  if (isLoading) {
    return <ChatWindowLoadingState />
  }

  if (messages.length === 0) {
    if (emptyState === "skeleton") {
      return <ChatWindowAdminReadOnlyEmpty />
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-950 text-xs font-bold text-arse-cyan">
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
