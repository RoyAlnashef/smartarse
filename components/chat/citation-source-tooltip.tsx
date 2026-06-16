"use client"

import type { CSSProperties, ReactElement, ReactNode } from "react"
import { useSyncExternalStore } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/** Hover tooltips flash open/closed on touch; use tap-to-toggle popovers instead. */
const PREFER_CITATION_POPOVER_MQ =
  "(hover: none), (pointer: coarse), (max-width: 767px)"

function subscribePreferCitationPopover(onStoreChange: () => void) {
  const mq = window.matchMedia(PREFER_CITATION_POPOVER_MQ)
  mq.addEventListener("change", onStoreChange)
  return () => mq.removeEventListener("change", onStoreChange)
}

function getPreferCitationPopoverSnapshot() {
  return window.matchMedia(PREFER_CITATION_POPOVER_MQ).matches
}

function getPreferCitationPopoverServerSnapshot() {
  return false
}

function usePreferCitationPopover() {
  return useSyncExternalStore(
    subscribePreferCitationPopover,
    getPreferCitationPopoverSnapshot,
    getPreferCitationPopoverServerSnapshot
  )
}

export function CitationSourceTooltip({
  trigger,
  side = "top",
  sideOffset = 4,
  className,
  style,
  children,
}: {
  trigger: ReactElement
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const preferPopover = usePreferCitationPopover()

  if (preferPopover) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          side={side}
          sideOffset={sideOffset}
          collisionPadding={16}
          className={className}
          style={style}
        >
          {children}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={sideOffset}
        className={className}
        style={style}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  )
}
