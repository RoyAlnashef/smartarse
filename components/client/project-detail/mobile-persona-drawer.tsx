"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { PersonaPanel, type PersonaMock } from "@/components/client/project-detail/persona-drawer"

export function MobilePersonaDrawer({
  open,
  onOpenChange,
  appliedPersona,
  onApply,
  onClearPersona,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  appliedPersona: PersonaMock | null
  onApply: (personaId: string) => void
  onClearPersona?: () => void
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
        aria-label="Close persona panel"
      />
      <div
        onTransitionEnd={handleTransitionEnd}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[85%] justify-end transition-transform duration-200 ease-out",
          entering || exiting ? "translate-x-full" : "translate-x-0"
        )}
      >
        <PersonaPanel
          className="max-w-sm shadow-[-4px_0_24px_rgba(0,0,0,0.08)]"
          appliedPersona={appliedPersona}
          onApply={onApply}
          onClearPersona={onClearPersona}
          onClose={requestClose}
        />
      </div>
    </div>
  )
}
