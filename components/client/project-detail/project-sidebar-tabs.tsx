"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  EmptyPane,
  PersonaPanel,
  type PersonaMock,
} from "@/components/client/project-detail/persona-drawer"
import { ChatHistoryMockList } from "@/components/chat/chat-history-mock-list"

/** Set true when the Studio tab and pane are ready to ship. */
const SHOW_STUDIO_TAB = false

export type ProjectSidebarTabsProps = {
  appliedPersona: PersonaMock | null
  onApplyPersona: (personaId: string) => void
  onClearPersona?: () => void
  /** When set, PersonaPanel shows header dismiss (e.g. mobile overlay). Omit on desktop column. */
  personaPanelOnClose?: () => void
  /** Chat History tab: when user picks a past question (mock re-run / future API). */
  onHistoryQuestionSelect?: (question: string) => void
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
  onHistoryQuestionSelect,
  className,
}: ProjectSidebarTabsProps) {
  return (
    <Tabs
      defaultValue="chat-history"
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <div className="shrink-0 px-4">
        <TabsList
          variant="line"
          className="!flex min-h-12 h-auto w-full items-end justify-center gap-6 rounded-none border-b-0 bg-transparent p-0"
          aria-label="Sidebar sections"
        >
          <TabsTrigger value="chat-history" className={tabTriggerClass}>
            Chat History
          </TabsTrigger>
          <TabsTrigger value="personas" className={tabTriggerClass}>
            Personas
          </TabsTrigger>
          {SHOW_STUDIO_TAB ? (
            <TabsTrigger value="studio" className={tabTriggerClass}>
              Studio
            </TabsTrigger>
          ) : null}
        </TabsList>
      </div>

      <TabsContent value="chat-history" className={tabContentClass}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-arse-black/[0.02]">
            <ChatHistoryMockList
              onQuestionSelect={onHistoryQuestionSelect}
              className="min-h-0 flex-1"
            />
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

      {SHOW_STUDIO_TAB ? (
        <TabsContent value="studio" className={tabContentClass}>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <EmptyPane title="Studio" />
          </div>
        </TabsContent>
      ) : null}
    </Tabs>
  )
}
