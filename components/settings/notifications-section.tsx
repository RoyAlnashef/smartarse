"use client"

import { Switch } from "@/components/ui/switch"
import { SettingsBlock } from "@/components/settings/settings-block"

export type NotificationPrefs = {
  emailNewQueries: boolean
  weeklyUsageSummary: boolean
  systemMaintenanceAlerts: boolean
}

export function NotificationsSection({
  value,
  onChange,
  className,
}: {
  className?: string
  value: NotificationPrefs
  onChange: (next: NotificationPrefs) => void
}) {
  return (
    <SettingsBlock
      className={className}
      title="Notifications"
      description="Control how we alert you about account activity."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Email notifications for new queries</p>
            <p className="text-xs text-muted-foreground">
              Receive alerts when new AI queries are made on your projects.
            </p>
          </div>
          <Switch
            checked={value.emailNewQueries}
            onCheckedChange={(checked) =>
              onChange({ ...value, emailNewQueries: checked })
            }
            aria-label="Toggle email notifications for new queries"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Weekly usage summary</p>
            <p className="text-xs text-muted-foreground">
              Get a weekly digest of platform activity and credit usage.
            </p>
          </div>
          <Switch
            checked={value.weeklyUsageSummary}
            onCheckedChange={(checked) =>
              onChange({ ...value, weeklyUsageSummary: checked })
            }
            aria-label="Toggle weekly usage summary"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">System maintenance alerts</p>
            <p className="text-xs text-muted-foreground">
              Be notified about planned downtime and updates.
            </p>
          </div>
          <Switch
            checked={value.systemMaintenanceAlerts}
            onCheckedChange={(checked) =>
              onChange({ ...value, systemMaintenanceAlerts: checked })
            }
            aria-label="Toggle system maintenance alerts"
          />
        </div>
      </div>
    </SettingsBlock>
  )
}

