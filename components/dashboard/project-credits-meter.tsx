"use client"

import { Coins } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "card" | "header"

export function ProjectCreditsMeter({
  creditBalance,
  usedCredits,
  variant = "card",
  className,
}: {
  creditBalance: number
  usedCredits: number
  variant?: Variant
  className?: string
}) {
  const overBudget = usedCredits > creditBalance

  const labelClass =
    variant === "header" ? "text-xs text-muted-foreground" : "text-[11px] text-muted-foreground"
  const valueClass =
    variant === "header"
      ? "text-sm font-semibold tabular-nums text-foreground"
      : "text-xs font-medium tabular-nums text-foreground"

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        variant === "header"
          ? "w-fit rounded-xl border border-border bg-white px-3 py-2 shadow-sm"
          : "min-w-0 w-full",
        className
      )}
      role="group"
      aria-label={`Credits: ${creditBalance.toLocaleString()} balance, ${usedCredits.toLocaleString()} used`}
    >
      <Coins className={cn("text-arse-pink shrink-0", variant === "header" ? "h-4 w-4" : "h-3.5 w-3.5")} aria-hidden />
      <span className="sr-only">Credits</span>

      <div className="flex min-w-0 flex-wrap items-baseline gap-x-1 gap-y-1">
        <span className={valueClass}>{creditBalance.toLocaleString()}</span>
        <span className={labelClass}>available</span>
        <span className="mx-0.5 text-muted-foreground" aria-hidden>
          -
        </span>
        <span
          className={cn(
            valueClass,
            overBudget && "text-destructive"
          )}
        >
          {usedCredits.toLocaleString()}
        </span>
        <span className={labelClass}>spent</span>
      </div>
    </div>
  )
}
