"use client"

import { Coins } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "card" | "header"

export function ProjectCreditsMeter({
  usedCredits,
  totalCredits,
  variant = "card",
  className,
}: {
  usedCredits: number
  totalCredits: number
  variant?: Variant
  className?: string
}) {
  const balance = totalCredits
  const hasAllocation = balance > 0
  const remaining = Math.max(0, balance - usedCredits)
  const overBudget = usedCredits > balance
  const pctLeft = hasAllocation ? Math.min(100, (remaining / balance) * 100) : 0
  const barPct = pctLeft
  const lowRemaining = hasAllocation && pctLeft > 0 && pctLeft <= 15

  const iconClass =
    variant === "header" ? "h-4 w-4 shrink-0" : "h-3.5 w-3.5 shrink-0"
  const trackClass =
    variant === "header" ? "h-2 min-w-[3rem] flex-1" : "h-1.5 min-w-[2.5rem] flex-1"
  const fillClass = cn(
    "rounded-full transition-[width] duration-500 ease-out",
    overBudget
      ? "bg-destructive"
        : lowRemaining
        ? "bg-amber-500"
        : "bg-arse-pink"
  )

  const fractionClass =
    variant === "header"
      ? "shrink-0 text-sm font-semibold tabular-nums"
      : "shrink-0 text-xs font-medium tabular-nums"
  const pctClass =
    variant === "header"
      ? "w-9 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground"
      : "w-8 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground"

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        variant === "header"
          ? "w-fit max-w-[400px] rounded-xl border border-border bg-white px-3 py-2 shadow-sm"
          : "w-full",
        className
      )}
    >
      <Coins className={cn("text-arse-pink", iconClass)} aria-hidden />
      <span className="sr-only">Credits</span>

      {hasAllocation ? (
        <>
          <span
            className={cn(
              fractionClass,
              "text-foreground",
              overBudget && "text-destructive",
              !overBudget && lowRemaining && "text-amber-700 dark:text-amber-500"
            )}
          >
            <span className="tabular-nums">{remaining.toLocaleString()}</span>
            <span className="font-normal text-muted-foreground">
              {" "}
              / {balance.toLocaleString()}{" "}
            </span>
            <span className="sr-only">credits remaining of allocated</span>
            <span className="font-normal text-muted-foreground" aria-hidden>
              left
            </span>
          </span>

          <div
            className={cn(
              "min-w-0 max-w-full overflow-hidden rounded-full bg-muted",
              trackClass
            )}
            role="progressbar"
            aria-valuenow={Math.round(barPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${Math.round(pctLeft)} percent of credits remaining`}
            aria-label="Credit balance remaining"
          >
            <div
              className={cn("h-full min-w-0", fillClass)}
              style={{ width: `${barPct}%` }}
            />
          </div>

          <span className={pctClass}>
            {overBudget ? (
              <span className="text-destructive">0%</span>
            ) : (
              <>
                <span className="tabular-nums">{Math.round(pctLeft)}%</span>
                <span className="sr-only"> of credits remaining</span>
              </>
            )}
          </span>
        </>
      ) : (
        <p
          className={cn(
            "min-w-0 text-muted-foreground",
            variant !== "header" && "flex-1",
            variant === "header" ? "text-xs" : "text-[11px]"
          )}
        >
          <span className="font-medium tabular-nums text-foreground">
            {usedCredits.toLocaleString()}
          </span>{" "}
          <span className="text-muted-foreground">used</span>
          <span className="text-muted-foreground">
            {" "}
            ·{" "}
            {variant === "header"
              ? "No credits allocated — add in Settings."
              : "No credits allocated."}
          </span>
        </p>
      )}
    </div>
  )
}
