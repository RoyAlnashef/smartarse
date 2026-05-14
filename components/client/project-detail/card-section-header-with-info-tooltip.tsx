"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/** Filled “i in circle” (stroke-free) for tooltips in pink card headers. */
function SolidInfoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" />
    </svg>
  )
}

export function CardSectionHeaderWithInfoTooltip({
  title,
  tooltipText,
  className,
}: {
  title: string
  tooltipText: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-arse-pink px-4 py-2 font-arse-title text-xs font-bold tracking-wide text-arse-white",
        className,
      )}
    >
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="mx-auto flex max-w-full cursor-help items-center justify-center gap-1.5 rounded-sm px-0.5 py-0.5 text-center outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-arse-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-arse-pink"
              aria-label={`About ${title}: ${tooltipText}`}
            >
              <span className="font-extrabold">{title}</span>
              <SolidInfoIcon className="h-3.5 w-3.5 text-arse-white" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={6}
            className="max-w-64 border-dark-800 bg-dark-950 px-3 py-2 font-arse-body text-xs font-normal leading-relaxed text-arse-white/95 shadow-lg"
          >
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
