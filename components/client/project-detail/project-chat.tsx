"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Send, SlidersHorizontal } from "lucide-react"
import type {
  ChatMessage,
  PersonaActivatedEvent,
  PersonaEndedEvent,
  ChatTimelineItem,
} from "@/lib/types"
import { isPersonaActivatedEvent, isPersonaEndedEvent } from "@/lib/types"
import { cn } from "@/lib/utils"
import { PERSONA_CHAT_SHELL_CLASS } from "@/components/client/project-detail/persona-chat-shell-classes"
import { MOCK_SEGMENT_PERSONAS } from "@/components/client/project-detail/persona-drawer"

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

function formatEventTimestamp(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  if (isToday) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function PersonaEventBubble({
  event,
  persona,
}: {
  event: PersonaActivatedEvent
  persona: (typeof MOCK_SEGMENT_PERSONAS)[number]
}) {
  return (
    <div
      className="w-full"
      role="status"
      aria-label={`Segment persona activated: ${persona.title} at ${formatEventTimestamp(event.timestamp)}`}
    >
      <div className="w-full rounded-2xl border-2 border-arse-pink/35 bg-arse-pink/[0.07] px-4 py-3 text-sm text-arse-black">
        <p className="font-arse-body text-xs text-arse-black/80">
          <span className="mr-1 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-arse-pink" />{" "}
          Speaking as — <span className="font-semibold text-arse-black">{persona.title}</span>
          <span className="ml-2 font-arse-body text-arse-black/50">
            {formatEventTimestamp(event.timestamp)}
          </span>
        </p>
        <p className="mt-2 font-arse-body text-sm leading-relaxed">
          <span className="font-arse-title font-bold">Segment persona activated.</span> You&apos;re
          now speaking with a representative voice of{" "}
          <strong>{persona.title}</strong> (n={persona.surveyN}, {persona.surveyPctLabel}). Average
          concern: <strong>{persona.avgConcern}</strong>, average sustainable actions:{" "}
          <strong>{persona.avgActions}</strong>.
        </p>
        <p className="mt-2 font-arse-body text-xs text-arse-black/60">
          Ask about this segment&apos;s views, barriers, or motivations.
        </p>
      </div>
    </div>
  )
}

export function ProjectChat({
  messages,
  personaEvents = [],
  disabled,
  appliedPersonaId,
  onSend,
  onOpenPersonas,
  onPersonaActivated,
  onPersonaEnded,
}: {
  messages: ChatMessage[]
  personaEvents?: (PersonaActivatedEvent | PersonaEndedEvent)[]
  disabled?: boolean
  appliedPersonaId: string | null
  onSend?: (content: string) => void
  onOpenPersonas?: () => void
  onPersonaActivated?: (personaId: string) => void
  onPersonaEnded?: (personaId: string) => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState("")

  const appliedPersona = useMemo(
    () =>
      appliedPersonaId
        ? (MOCK_SEGMENT_PERSONAS.find((p) => p.id === appliedPersonaId) ?? null)
        : null,
    [appliedPersonaId]
  )

  const timelineItems = useMemo((): ChatTimelineItem[] => {
    const items: ChatTimelineItem[] = [...messages, ...personaEvents]
    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    return items
  }, [messages, personaEvents])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [timelineItems])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend?.(trimmed)
    setValue("")
  }

  const inputPlaceholder = appliedPersona
    ? `Ask about ${appliedPersona.title}…`
    : "Ask me anything…"

  return (
    <section
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border-4 border-arse-pink bg-white",
        PERSONA_CHAT_SHELL_CLASS
      )}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => onOpenPersonas?.()}
          aria-label="Open personas and studio controls"
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-xl border-2 border-arse-black bg-white px-3 py-1.5 font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black shadow-[3px_3px_0_0_var(--arse-pink)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_var(--arse-pink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink sm:right-4 sm:top-4 lg:hidden"
        >
          {appliedPersona ? (
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          ) : null}
          <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          Controls
        </button>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 sm:p-6">
            {timelineItems.length === 0 ? (
              <div className="max-w-xl">
                <div className="inline-block rounded-2xl rounded-bl-sm border-2 border-arse-black/20 bg-white px-4 py-3 text-sm text-arse-black">
                  Hi there!
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {timelineItems.map((item) => {
                  if (isPersonaActivatedEvent(item)) {
                    const persona = MOCK_SEGMENT_PERSONAS.find(
                      (p) => p.id === item.personaId
                    )
                    if (!persona) return null
                    return (
                      <PersonaEventBubble
                        key={item.id}
                        event={item}
                        persona={persona}
                      />
                    )
                  }
                  if (isPersonaEndedEvent(item)) {
                    const persona = MOCK_SEGMENT_PERSONAS.find(
                      (p) => p.id === item.personaId
                    )
                    const personaName = persona?.title ?? "a persona"
                    return (
                      <p
                        key={item.id}
                        className="py-2 text-center font-arse-body text-sm text-arse-black/55"
                        role="status"
                        aria-label={`Persona session ended: ${personaName}`}
                      >
                        smartA.R.S.E. is no longer speaking as {personaName}.
                      </p>
                    )
                  }
                  return <MessageBubble key={item.id} message={item} />
                })}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
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
            placeholder={inputPlaceholder}
            disabled={disabled}
            className={cn(
              "block w-full resize-none rounded-xl border-4 border-arse-black bg-arse-cyan px-4 py-3 font-arse-body text-sm text-arse-black placeholder:text-arse-black/45",
              "focus:outline-none focus:ring-2 focus:ring-arse-pink disabled:opacity-50"
            )}
          />
          <button
            type="submit"
            disabled={!value.trim() || disabled}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-4 border-arse-black bg-white text-arse-black",
              "shadow-[4px_4px_0_0_var(--arse-pink)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_0_var(--arse-pink)]",
              "disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_var(--arse-pink)]"
            )}
          >
            <Send className="h-4 w-4" strokeWidth={2.5} />
            <span className="sr-only">Send message</span>
          </button>
        </form>
      </div>
    </section>
  )
}
