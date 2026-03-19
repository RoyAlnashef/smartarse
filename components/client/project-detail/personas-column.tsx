"use client"

import { useMemo } from "react"
import { ChevronLeft, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { PERSONA_CHAT_SHELL_CLASS } from "@/components/client/project-detail/persona-chat-shell-classes"
import {
  MOCK_SEGMENT_PERSONAS,
  PersonaPanel,
} from "@/components/client/project-detail/persona-drawer"

export function PersonasColumn({
  collapsed,
  onToggleCollapsed,
  appliedPersonaId,
  onApplyPersona,
  onClearPersona,
}: {
  collapsed: boolean
  onToggleCollapsed: (next: boolean) => void
  appliedPersonaId: string | null
  onApplyPersona: (personaId: string) => void
  onClearPersona: () => void
}) {
  const appliedPersona = useMemo(
    () =>
      appliedPersonaId
        ? (MOCK_SEGMENT_PERSONAS.find((p) => p.id === appliedPersonaId) ?? null)
        : null,
    [appliedPersonaId]
  )

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-3xl border-4 border-arse-pink bg-white",
        PERSONA_CHAT_SHELL_CLASS
      )}
    >
      {collapsed ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col items-stretch border-l-2 border-arse-black/10 bg-white">
          <button
            type="button"
            onClick={() => onToggleCollapsed(false)}
            className="flex min-h-0 flex-1 flex-col items-center gap-2 px-0 py-2 font-arse-title text-[9px] font-bold uppercase tracking-wide text-arse-black transition hover:bg-arse-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink focus-visible:ring-inset"
            aria-label="Expand personas column"
          >
            <ChevronLeft className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
            <span
              className="select-none text-center leading-tight text-arse-black/70 [writing-mode:vertical-rl] [text-orientation:mixed]"
              aria-hidden
            >
              Personas
            </span>
            {appliedPersona ? (
              <span className="relative mt-auto flex h-2 w-2 shrink-0 pb-1" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            ) : (
              <Users
                className="mt-auto h-4 w-4 shrink-0 pb-1 text-arse-black/50"
                strokeWidth={2.5}
                aria-hidden
              />
            )}
          </button>
        </div>
      ) : (
        <PersonaPanel
          onCollapseToRail={() => onToggleCollapsed(true)}
          appliedPersona={appliedPersona}
          onApply={onApplyPersona}
          onClearPersona={onClearPersona}
        />
      )}
    </div>
  )
}
