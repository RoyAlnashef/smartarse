"use client"

import { useState } from "react"
import { Send } from "lucide-react"

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (message: string) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 border-t border-border bg-card p-4">
      <div className="flex-1">
        <textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder="Ask a question about your research data..."
          disabled={disabled}
          className="block w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20 disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dark-950 text-white transition-colors hover:bg-dark-800 disabled:opacity-40"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </button>
    </form>
  )
}
