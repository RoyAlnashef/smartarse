"use client"

import { Coins } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "card" | "header"

/** Balance below this uses warning styling (card footer + project header meter). */
export const CREDIT_BALANCE_WARNING_THRESHOLD = 50

export function ProjectCreditsMeter({
  creditBalance,
  usedCredits,
  variant = "card",
  onClick,
  className,
}: {
  creditBalance: number
  usedCredits: number
  variant?: Variant
  /** When set with `variant="header"`, renders a button (e.g. navigate to credits settings). */
  onClick?: () => void
  className?: string
}) {
  const overBudget = usedCredits > creditBalance
  const warn = creditBalance < CREDIT_BALANCE_WARNING_THRESHOLD
  const headerInteractive = variant === "header" && onClick != null

  const labelClass = cn(
    variant === "header" ? "text-xs text-muted-foreground" : "text-[11px] text-muted-foreground",
    warn && "text-amber-800/90 dark:text-amber-200/90"
  )
  const valueClass = cn(
    variant === "header"
      ? "text-sm font-semibold tabular-nums text-foreground"
      : "text-xs font-medium tabular-nums text-foreground",
    warn && "text-amber-950 dark:text-amber-50"
  )

  const shellClass = cn(
    "flex items-center gap-2",
    variant === "header"
      ? cn(
          "w-fit rounded-xl border px-3 py-2 text-left shadow-sm transition-colors",
          warn
            ? "border-amber-200/90 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/40"
            : "border-border bg-white",
          headerInteractive &&
            cn(
              "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              warn
                ? "hover:bg-amber-100/90 dark:hover:bg-amber-950/55"
                : "hover:bg-muted/70 dark:hover:bg-muted/40"
            )
        )
      : "min-w-0 w-full",
    className
  )

  const creditsSummary = `Credits: ${creditBalance.toLocaleString()} balance, ${usedCredits.toLocaleString()} used`

  const body = (
    <>
      <Coins
        className={cn(
          "shrink-0",
          variant === "header" ? "h-4 w-4" : "h-3.5 w-3.5",
          warn ? "text-amber-600 dark:text-amber-400" : "text-arse-pink"
        )}
        aria-hidden
      />
      <span className="sr-only">Credits</span>

      <div className="flex min-w-0 flex-wrap items-baseline gap-x-1 gap-y-1">
        <span className={valueClass}>{creditBalance.toLocaleString()}</span>
        <span className={labelClass}>available</span>
        <span
          className={cn("mx-0.5 text-muted-foreground", warn && "text-amber-700/80 dark:text-amber-300/80")}
          aria-hidden
        >
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
    </>
  )

  if (headerInteractive) {
    return (
      <button
        type="button"
        className={shellClass}
        onClick={onClick}
        aria-label={`Open credits in project settings. ${creditsSummary}`}
      >
        {body}
      </button>
    )
  }

  return (
    <div className={shellClass} role="group" aria-label={creditsSummary}>
      {body}
    </div>
  )
}
