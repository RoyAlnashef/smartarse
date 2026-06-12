"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  EmptyPane,
  PersonaPanel,
  type PersonaMock,
} from "@/components/client/project-detail/persona-drawer"
import type {
  FocusGroupCountryContext,
  FocusGroupSession,
  SavedCustomAudience,
} from "@/lib/types"

export type ProjectSidebarTabsProps = {
  appliedPersona: PersonaMock | null
  appliedCustomAudience: SavedCustomAudience | null
  /** Active focus group session (renders active chip + locks other modes). */
  appliedFocusGroup?: FocusGroupSession | null
  projectId: string
  onApplyPersona: (personaId: string) => void
  onApplyCustomAudience: (audience: SavedCustomAudience) => void
  onReplaceAppliedCustomAudience?: (audience: SavedCustomAudience) => void
  onPromoteDraftExploreThread?: (audience: SavedCustomAudience) => void
  onClearPersona?: () => void
  onClearCustomAudience?: () => void
  onStartFocusGroup?: (
    personaIds: readonly string[],
    country: FocusGroupCountryContext,
    topic: string
  ) => Promise<void> | void
  onEndFocusGroup?: () => Promise<void> | void
  /** When true, focus-group round is mid-flight (input + tabs become read-only). */
  focusGroupRunning?: boolean
  onSuggestedQuestionSelect?: (question: string) => void
  personaLocked?: boolean
  disabled?: boolean
  /** When set, PersonaPanel shows header dismiss (e.g. mobile overlay). Omit on desktop column. */
  personaPanelOnClose?: () => void
  className?: string
  /** Resolved study segments (mock + optional DB overrides). */
  segmentPersonas?: PersonaMock[]
  onSavedAudiencesHydrated?: (audiences: SavedCustomAudience[]) => void
  onSavedAudienceUpsert?: (audience: SavedCustomAudience) => void
  onSavedAudienceDeleted?: (audienceId: string) => void
}

const tabContentClass =
  "mt-0 flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-2 focus-visible:outline-none focus-visible:ring-0 data-[state=inactive]:hidden"

/** Match panel shell `border-4`; inactive keeps transparent border-b-4 so layout does not shift. */
const tabTriggerClass =
  "min-w-0 shrink whitespace-normal border-b-4 border-transparent px-1 py-2 text-center font-arse-title text-[10px] font-bold leading-tight tracking-wide text-arse-black/50 data-[state=active]:border-arse-pink data-[state=active]:text-arse-black"

export function ProjectSidebarTabs({
  appliedPersona,
  appliedCustomAudience,
  appliedFocusGroup = null,
  projectId,
  onApplyPersona,
  onApplyCustomAudience,
  onReplaceAppliedCustomAudience,
  onPromoteDraftExploreThread,
  onClearPersona,
  onClearCustomAudience,
  onStartFocusGroup,
  onEndFocusGroup,
  focusGroupRunning = false,
  onSuggestedQuestionSelect,
  personaLocked = false,
  disabled = false,
  personaPanelOnClose,
  className,
  segmentPersonas,
  onSavedAudiencesHydrated,
  onSavedAudienceUpsert,
  onSavedAudienceDeleted,
}: ProjectSidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<"personas" | "studio">("personas")

  useEffect(() => {
    if (personaLocked) setActiveTab("personas")
  }, [personaLocked])

  function handleTopLevelTabChange(nextTab: string) {
    if (personaLocked && nextTab !== "personas") return
    setActiveTab(nextTab as "personas" | "studio")
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTopLevelTabChange}
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        disabled && "pointer-events-none select-none opacity-70",
        className
      )}
      aria-disabled={disabled}
    >
      <div className="shrink-0 px-4">
        <TabsList
          variant="line"
          className="!flex min-h-12 h-auto w-full items-end justify-center gap-3 rounded-none border-b-0 bg-transparent p-0 sm:gap-6"
          aria-label="Sidebar sections"
        >
          <TabsTrigger value="personas" className={tabTriggerClass}>
            Personas
          </TabsTrigger>
          <TabsTrigger
            value="studio"
            className={cn(
              tabTriggerClass,
              personaLocked && "cursor-not-allowed text-arse-black/35 data-[state=active]:border-transparent"
            )}
            disabled={personaLocked}
            aria-disabled={personaLocked}
          >
            Studio
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="personas" className={tabContentClass}>
        <PersonaPanel
          appliedPersona={appliedPersona}
          appliedCustomAudience={appliedCustomAudience}
          appliedFocusGroup={appliedFocusGroup}
          projectId={projectId}
          onApply={onApplyPersona}
          onApplyCustomAudience={onApplyCustomAudience}
          onReplaceAppliedCustomAudience={onReplaceAppliedCustomAudience}
          onPromoteDraftExploreThread={onPromoteDraftExploreThread}
          onClearPersona={onClearPersona}
          onClearCustomAudience={onClearCustomAudience}
          onStartFocusGroup={onStartFocusGroup}
          onEndFocusGroup={onEndFocusGroup}
          focusGroupRunning={focusGroupRunning}
          onSuggestedQuestionSelect={onSuggestedQuestionSelect}
          personaLocked={personaLocked}
          disabled={disabled}
          onClose={personaPanelOnClose}
          className="min-h-0 min-w-0 flex-1"
          segmentPersonas={segmentPersonas}
          onSavedAudiencesHydrated={onSavedAudiencesHydrated}
          onSavedAudienceUpsert={onSavedAudienceUpsert}
          onSavedAudienceDeleted={onSavedAudienceDeleted}
        />
      </TabsContent>

      <TabsContent value="studio" className={tabContentClass}>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <EmptyPane title="Studio" variant="studio" />
        </div>
      </TabsContent>
    </Tabs>
  )
}
