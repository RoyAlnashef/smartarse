"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  EmptyPane,
  PersonaPanel,
  type PersonaMock,
} from "@/components/client/project-detail/persona-drawer"

export type ProjectSidebarTabsProps = {
  appliedPersona: PersonaMock | null
  onApplyPersona: (personaId: string) => void
  onClearPersona?: () => void
  /** When set, PersonaPanel shows header dismiss (e.g. mobile overlay). Omit on desktop column. */
  personaPanelOnClose?: () => void
  className?: string
}

const tabContentClass =
  "mt-0 flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-2 focus-visible:outline-none focus-visible:ring-0 data-[state=inactive]:hidden"

/** Match panel shell `border-4`; inactive keeps transparent border-b-4 so layout does not shift. */
const tabTriggerClass =
  "shrink-0 border-b-4 border-transparent font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black/50 data-[state=active]:border-arse-pink data-[state=active]:text-arse-black"

export function ProjectSidebarTabs({
  appliedPersona,
  onApplyPersona,
  onClearPersona,
  personaPanelOnClose,
  className,
}: ProjectSidebarTabsProps) {
  return (
    <Tabs
      defaultValue="personas"
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <div className="shrink-0 px-4">
        <TabsList
          variant="line"
          className="!flex min-h-12 h-auto w-full items-end justify-center gap-6 rounded-none border-b-0 bg-transparent p-0"
          aria-label="Sidebar sections"
        >
          <TabsTrigger value="personas" className={tabTriggerClass}>
            Personas
          </TabsTrigger>
          <TabsTrigger value="studio" className={tabTriggerClass}>
            Studio
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="personas" className={tabContentClass}>
        <PersonaPanel
          appliedPersona={appliedPersona}
          onApply={onApplyPersona}
          onClearPersona={onClearPersona}
          onClose={personaPanelOnClose}
          className="min-h-0 min-w-0 flex-1"
        />
      </TabsContent>

      <TabsContent value="studio" className={tabContentClass}>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <EmptyPane title="Studio" />
        </div>
      </TabsContent>
    </Tabs>
  )
}
