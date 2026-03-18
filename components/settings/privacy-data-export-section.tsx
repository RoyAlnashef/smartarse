"use client"

import { useMemo } from "react"
import { Download, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SettingsBlock } from "@/components/settings/settings-block"

function downloadJson({
  filename,
  data,
}: {
  filename: string
  data: unknown
}) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function PrivacyDataExportSection({
  exportData,
  className,
  privacyUrl = "/help/privacy",
  onExport,
}: {
  className?: string
  privacyUrl?: string
  exportData?: unknown
  onExport?: () => Promise<void> | void
}) {
  const payload = useMemo(() => {
    return exportData ?? { exportedAt: new Date().toISOString() }
  }, [exportData])

  return (
    <SettingsBlock
      className={className}
      title="Privacy & Data Export"
      description="Manage how your data is handled. Export is mocked for now."
      icon={<Shield className="h-5 w-5 text-muted-foreground" />}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-background/60 p-4">
          <p className="text-sm font-medium">Privacy policy</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Review our data protection terms and how we process information.
          </p>
          <a
            href={privacyUrl}
            className="mt-3 inline-flex text-sm font-medium text-mint-600 underline decoration-mint-400 underline-offset-4 hover:text-mint-500"
          >
            View privacy policy
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-4">
          <div>
            <p className="text-sm font-medium">Export my data</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Downloads a JSON file (mock) containing the export payload.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              await onExport?.()
              downloadJson({
                filename: "smartA-rase-export.json",
                data: payload,
              })
            }}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
    </SettingsBlock>
  )
}

