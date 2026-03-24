"use client"

import { useRef, useEffect } from "react"
import { MessageSquare } from "lucide-react"
import type { ChatMessage } from "@/lib/types"
import { MessageBubble } from "./message-bubble"

export function ChatWindow({
  messages,
  isTyping,
  readOnly = false,
}: {
  messages: ChatMessage[]
  isTyping?: boolean
  /** When true, message area uses page background (var(--background)) for a view-only admin preview. */
  readOnly?: boolean
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  if (messages.length === 0) {
    return (
      <div
        className={`flex flex-1 flex-col items-center justify-center p-8 ${readOnly ? "bg-background" : ""}`}
      >
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
    <div
      className={`flex-1 space-y-6 overflow-y-auto p-4 lg:p-6 ${readOnly ? "bg-background" : ""}`}
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-950 text-xs font-bold text-mint-300">
            D
          </div>
          <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
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
