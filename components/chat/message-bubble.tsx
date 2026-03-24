"use client"

import type { ChatMessage } from "@/lib/types"

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* AI avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-950 text-xs font-bold text-mint-300">
          D
        </div>
      )}

      <div className={`max-w-[75%] space-y-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-br-md bg-dark-950 text-white"
              : "rounded-bl-md bg-background text-foreground"
          }`}
        >
          {/* Render markdown-like content simply */}
          <div className="prose-sm whitespace-pre-wrap">
            {message.content.split("\n").map((line, i) => {
              // Handle bold text
              const parts = line.split(/(\*\*.*?\*\*)/g)
              return (
                <span key={i}>
                  {parts.map((part, j) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return (
                        <strong key={j} className="font-semibold">
                          {part.slice(2, -2)}
                        </strong>
                      )
                    }
                    return <span key={j}>{part}</span>
                  })}
                  {i < message.content.split("\n").length - 1 && <br />}
                </span>
              )
            })}
          </div>
        </div>
        <p
          className={`text-xs text-muted-foreground ${isUser ? "text-right" : "text-left"}`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-100 text-xs font-semibold text-mint-700">
          You
        </div>
      )}
    </div>
  )
}
