"use client"

import { SettingsBlock } from "@/components/settings/settings-block"

export function BillingUsageSection({
  totalCredits,
  usedCredits,
  className,
}: {
  className?: string
  totalCredits: number
  usedCredits: number
}) {
  const remaining = Math.max(0, totalCredits - usedCredits)

  return (
    <SettingsBlock
      className={className}
      title="Billing & Usage"
      description="Your credit usage for this client account."
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Remaining credits</p>
              <p className="text-2xl font-bold">{remaining}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-sm font-medium">Total credits</p>
              <p className="text-lg font-semibold">{totalCredits}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Used credits: {usedCredits}. (Mock summary; no real billing yet.)
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-border bg-background/60 p-4">
            <p className="text-sm font-medium">Plan</p>
            <p className="text-sm text-muted-foreground">Pro (placeholder)</p>
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-background/60 p-4">
            <p className="text-sm font-medium">Next billing</p>
            <p className="text-sm text-muted-foreground">Not configured (mock)</p>
          </div>
        </div>
      </div>
    </SettingsBlock>
  )
}

