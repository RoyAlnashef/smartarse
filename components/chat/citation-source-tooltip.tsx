"use client"

import type { CSSProperties, ReactElement, ReactNode } from "react"
import { usePreferPopoverOverTooltip } from "@/hooks/use-prefer-popover-over-tooltip"
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
  const preferPopover = usePreferPopoverOverTooltip()

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
