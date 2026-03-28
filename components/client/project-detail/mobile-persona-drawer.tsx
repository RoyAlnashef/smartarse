"use client"

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEventHandler,
} from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProjectSidebarTabs } from "@/components/client/project-detail/project-sidebar-tabs"
import type { PersonaMock } from "@/components/client/project-detail/persona-drawer"

export function MobilePersonaDrawer({
  open,
  onOpenChange,
  appliedPersona,
  onApply,
  onClearPersona,
  onSidebarPointerDownCapture,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  appliedPersona: PersonaMock | null
  onApply: (personaId: string) => void
  onClearPersona?: () => void
  /** When project chat is blocked (e.g. not live), intercept sidebar controls (not close/backdrop). */
  onSidebarPointerDownCapture?: PointerEventHandler<HTMLDivElement>
}) {
  const [exiting, setExiting] = useState(false)
  const [entering, setEntering] = useState(false)
  const exitingRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(min-width: 1024px)")
    const onMqChange = () => {
      if (mq.matches) onOpenChange(false)
    }
    mq.addEventListener("change", onMqChange)
    return () => mq.removeEventListener("change", onMqChange)
  }, [onOpenChange])

  useEffect(() => {
    if (!open) {
      setExiting(false)
      exitingRef.current = false
      setEntering(false)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open) return
    setExiting(false)
    exitingRef.current = false
    setEntering(true)
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntering(false))
    })
    return () => cancelAnimationFrame(t)
  }, [open])

  function requestClose() {
    exitingRef.current = true
    setExiting(true)
  }

  function handleTransitionEnd(e: React.TransitionEvent) {
    if (e.target !== e.currentTarget) return
    if (exitingRef.current) {
      exitingRef.current = false
      setExiting(false)
      onOpenChange(false)
    }
  }

  if (!open && !exiting) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden" aria-hidden={!open && !exiting}>
      <div
        role="button"
        tabIndex={0}
        onClick={requestClose}
        onKeyDown={(e) => e.key === "Enter" && requestClose()}
        className={cn(
          "absolute inset-0 cursor-pointer bg-black/20 transition-opacity duration-200 ease-out",
          entering || exiting ? "opacity-0" : "opacity-100"
        )}
        aria-label="Close controls"
      />
      <div
        onTransitionEnd={handleTransitionEnd}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[85%] justify-end transition-transform duration-200 ease-out",
          entering || exiting ? "translate-x-full" : "translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex h-full min-h-0 w-full max-w-sm flex-col bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.08)]"
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-arse-black/10 px-3 py-2.5">
            <p className="font-arse-title text-xs font-bold uppercase tracking-wide text-arse-black">
              Controls
            </p>
            <button
              type="button"
              onClick={requestClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-arse-black/15 bg-white text-arse-black transition hover:border-arse-pink hover:bg-arse-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink"
              aria-label="Close controls"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
          <div
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
            onPointerDownCapture={onSidebarPointerDownCapture}
          >
            <ProjectSidebarTabs
              className="min-h-0 flex-1"
              appliedPersona={appliedPersona}
              onApplyPersona={onApply}
              onClearPersona={onClearPersona}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
