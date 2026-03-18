"use client"

import { useEffect, useRef, useState } from "react"
import { Send } from "lucide-react"
import type { ChatMessage } from "@/lib/types"
import { cn } from "@/lib/utils"

function Avatar({ label }: { label: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-arse-black bg-arse-white font-arse-title text-[10px] font-bold uppercase text-arse-black">
      {label}
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? <Avatar label="AI" /> : null}
      <div
        className={cn(
          "max-w-[min(42rem,90%)] rounded-2xl border-2 px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "border-arse-black bg-arse-cyan text-arse-black"
            : "border-arse-black/20 bg-white text-arse-black"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
      {isUser ? <Avatar label="ME" /> : null}
    </div>
  )
}

export function ProjectChat({
  messages,
  disabled,
  onSend,
}: {
  messages: ChatMessage[]
  disabled?: boolean
  onSend?: (content: string) => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState("")

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend?.(trimmed)
    setValue("")
  }

  return (
    <section className="flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-3xl border-4 border-arse-magenta bg-white">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="max-w-xl">
            <div className="inline-block rounded-2xl rounded-bl-sm border-2 border-arse-black/20 bg-white px-4 py-3 text-sm text-arse-black">
              Hi there!
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-3 border-t-2 border-arse-black/10 bg-white p-4 sm:p-5"
      >
        <label className="sr-only" htmlFor="project-chat-input">
          Ask a question
        </label>
        <textarea
          id="project-chat-input"
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder="Ask me anything…"
          disabled={disabled}
          className={cn(
            "block w-full resize-none rounded-xl border-4 border-arse-black bg-arse-cyan px-4 py-3 font-arse-body text-sm text-arse-black placeholder:text-arse-black/45",
            "focus:outline-none focus:ring-2 focus:ring-arse-magenta disabled:opacity-50"
          )}
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-4 border-arse-black bg-white text-arse-black",
            "shadow-[4px_4px_0_0_var(--arse-magenta)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_0_var(--arse-magenta)]",
            "disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_var(--arse-magenta)]"
          )}
        >
          <Send className="h-4 w-4" strokeWidth={2.5} />
          <span className="sr-only">Send message</span>
        </button>
      </form>
    </section>
  )
}

