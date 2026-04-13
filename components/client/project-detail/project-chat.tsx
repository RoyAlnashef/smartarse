"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Send, SlidersHorizontal } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
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

const LOADING_ACTIONS = [
  "Processing your brilliance...",
  "Thinking very hard in spreadsheets...",
  "Mathematizing the chaos...",
  "Comprehenderizing your question...",
  "Cross-referencing the data goblins...",
  "Crunching numbers with dramatic flair...",
  "Looking for patterns and plot twists...",
  "Triangulating insights at unsafe speed...",
]

function getRandomLoadingActionIndex(excludeIndex?: number): number {
  if (LOADING_ACTIONS.length <= 1) return 0
  let next = Math.floor(Math.random() * LOADING_ACTIONS.length)
  while (excludeIndex != null && next === excludeIndex) {
    next = Math.floor(Math.random() * LOADING_ACTIONS.length)
  }
  return next
}

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
          "max-w-[min(42rem,90%)] rounded-2xl border-2 px-4 text-sm leading-[1.7]",
          isUser
            ? "border-arse-black bg-arse-cyan py-3 text-arse-black"
            : "border-arse-black/20 bg-white py-5 text-arse-black sm:py-6"
        )}
      >
        <div
          className={cn(
            "min-w-0 text-sm leading-[1.7]",
            "break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
            "[&_p]:my-5 [&_ul]:my-5 [&_ol]:my-5 [&_li]:my-2 [&_li]:leading-relaxed",
            "[&_ul]:space-y-2 [&_ol]:space-y-2",
            "[&_h1]:mb-3 [&_h1]:mt-8 [&_h1]:first:mt-0 [&_h1]:text-lg [&_h1]:font-semibold",
            "[&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:first:mt-0 [&_h2]:text-base [&_h2]:font-semibold",
            "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:first:mt-0 [&_h3]:text-sm [&_h3]:font-semibold",
            "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-arse-black/30 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:italic",
            "[&_blockquote_p]:my-0 [&_blockquote_p+p]:mt-2",
            "[&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-arse-pink/60 hover:[&_a]:decoration-arse-pink",
            "[&_code]:rounded [&_code]:bg-arse-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em]",
            "[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-arse-black/90 [&_pre]:p-4 [&_pre]:text-arse-white",
            "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
            "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-arse-black/20 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-arse-black/20 [&_td]:px-2 [&_td]:py-1.5",
            "[&_hr]:my-8 [&_hr]:border-t [&_hr]:border-arse-black/15"
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node: _node, ...props }) => (
                <a {...props} target="_blank" rel="noreferrer noopener" />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
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
  isLoading = false,
  disabled,
  appliedPersonaId,
  onSend,
  onOpenPersonas,
  personasColumnCollapsed = false,
  onPersonaActivated,
  onPersonaEnded,
}: {
  messages: ChatMessage[]
  personaEvents?: (PersonaActivatedEvent | PersonaEndedEvent)[]
  isLoading?: boolean
  disabled?: boolean
  appliedPersonaId: string | null
  onSend?: (content: string) => void
  onOpenPersonas?: () => void
  /** When true at lg+, show Controls to restore the inline personas column. */
  personasColumnCollapsed?: boolean
  onPersonaActivated?: (personaId: string) => void
  onPersonaEnded?: (personaId: string) => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState("")
  const [loadingActionIndex, setLoadingActionIndex] = useState(0)

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
  }, [timelineItems, isLoading, loadingActionIndex])

  useEffect(() => {
    if (!isLoading) {
      setLoadingActionIndex(0)
      return
    }
    setLoadingActionIndex(getRandomLoadingActionIndex())
    const intervalId = window.setInterval(() => {
      setLoadingActionIndex((prev) => getRandomLoadingActionIndex(prev))
    }, 3400)
    return () => window.clearInterval(intervalId)
  }, [isLoading])

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
        "relative flex flex-col overflow-hidden rounded-3xl border-4 border-arse-pink bg-zinc-50",
        PERSONA_CHAT_SHELL_CLASS
      )}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => onOpenPersonas?.()}
          aria-label="Open personas and studio controls"
          className={cn(
            "absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-xl border-2 border-arse-black bg-white px-3 py-1.5 font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black shadow-[3px_3px_0_0_var(--arse-pink)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_var(--arse-pink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink sm:right-4 sm:top-4",
            !personasColumnCollapsed && "lg:hidden"
          )}
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
              <div className="max-w-[min(42rem,90%)]">
                <div className="block rounded-2xl rounded-bl-sm border-2 border-arse-black/20 bg-white px-4 py-4 text-sm text-arse-black sm:px-5 sm:py-5">
                  <p className="font-arse-body leading-relaxed">
                    Hi there! <br></br>I&apos;m <strong className="font-semibold">smartA.R.S.E.</strong>, and I answer
                    from this project&apos;s <strong className="font-semibold">Sources</strong>—the
                    documents your team added here. Ask in plain language; I&apos;ll stay grounded in
                    what&apos;s in those materials (and I&apos;ll say so when something isn&apos;t
                    covered).
                  </p>
                  {appliedPersona ? (
                    <p className="mt-3 font-arse-body leading-relaxed">
                      You&apos;ve got{" "}
                      <strong className="font-semibold">{appliedPersona.title}</strong> lined up—ask
                      what feels stuck, surprising, or worth pressure-testing from that segment&apos;s
                      point of view.
                    </p>
                  ) : null}
                  <p className="mt-4 font-arse-body text-sm leading-relaxed text-arse-black/85">
                    {appliedPersona ? (
                      <>
                        Switch personas or tweak how I speak anytime from{" "}
                        <strong className="font-semibold">Controls</strong>.
                      </>
                    ) : (
                      <>
                        Would you like me to speak in a segment's voice? Open{" "}
                        <strong className="font-semibold">Controls</strong> and choose a persona when
                        you&apos;re ready.
                      </>
                    )}
                  </p>
                  <p className="mt-4 font-arse-body text-sm font-semibold text-arse-black">
                    A few things to try:
                  </p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 font-arse-body text-sm leading-relaxed text-arse-black marker:text-arse-black/70">
                    <li>Summarize the big picture or the &quot;so what&quot; from the research.</li>
                    <li>Spot themes, tensions, or standout quotes worth revisiting.</li>
                    <li>Compare findings or ideas side by side.</li>
                    {appliedPersona ? (
                      <li>
                        Go deeper on motivations, barriers, or language this segment might use.
                      </li>
                    ) : (
                      <li>
                        Ask how attitudes, barriers, or trade-offs show up across the research.
                      </li>
                    )}
                  </ul>
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
                {isLoading ? (
                  <div className="flex gap-3" role="status" aria-live="polite" aria-label="Assistant is preparing a response">
                    <Avatar label="AI" />
                    <div className="max-w-[min(42rem,90%)] rounded-2xl rounded-bl-sm border-2 border-arse-black/20 bg-white px-4 py-3 text-sm text-arse-black">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-arse-pink" aria-hidden />
                        <p className="font-arse-body text-sm">{LOADING_ACTIONS[loadingActionIndex]}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
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
