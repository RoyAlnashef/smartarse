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

export function ProjectSidebarTabs({
  appliedPersona,
  onApplyPersona,
  onClearPersona,
  personaPanelOnClose,
  className,
}: ProjectSidebarTabsProps) {
  return (
    <Tabs
      defaultValue="chat-history"
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <div className="shrink-0 px-3 pt-3">
        <TabsList
          variant="line"
          className="!grid h-10 w-full grid-cols-3 items-end gap-0 rounded-none border-b-0 bg-transparent p-0"
          aria-label="Sidebar sections"
        >
          <TabsTrigger
            value="chat-history"
            className="min-w-0 justify-self-center font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black/50 data-[state=active]:border-arse-pink data-[state=active]:text-arse-black"
          >
            Chat History
          </TabsTrigger>
          <TabsTrigger
            value="personas"
            className="min-w-0 justify-self-center font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black/50 data-[state=active]:border-arse-pink data-[state=active]:text-arse-black"
          >
            Personas
          </TabsTrigger>
          <TabsTrigger
            value="studio"
            className="min-w-0 justify-self-center font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black/50 data-[state=active]:border-arse-pink data-[state=active]:text-arse-black"
          >
            Studio
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="chat-history" className={tabContentClass}>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-arse-black/15 bg-arse-black/[0.02] px-4 py-8 text-center">
            <p className="font-arse-title text-xs font-bold uppercase tracking-wide text-arse-black/50">
              Chat history
            </p>
            <p className="mt-3 max-w-[16rem] font-arse-body text-sm leading-relaxed text-arse-black/60">
              No questions yet. Ask something to get started.
            </p>
          </div>
        </div>
      </TabsContent>

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
