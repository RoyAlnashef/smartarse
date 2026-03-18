"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function SettingsBlock({
  className,
  title,
  description,
  icon,
  children,
}: {
  className?: string
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-xl border border-border bg-card p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? <div className="mt-0.5">{icon}</div> : null}
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  )
}

