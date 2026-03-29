"use client"

import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { PERSONA_CHAT_SHELL_CLASS } from "@/components/client/project-detail/persona-chat-shell-classes"
import {
  ProjectSidebarTabs,
  type ProjectSidebarTabsProps,
} from "@/components/client/project-detail/project-sidebar-tabs"

export type ProjectRightSidebarProps = ProjectSidebarTabsProps & {
  /** Hide the column (chat expands); button sits on the pink shell top-left. */
  onCollapseColumn?: () => void
}

export function ProjectRightSidebar({
  className,
  onCollapseColumn,
  ...tabsProps
}: ProjectRightSidebarProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden rounded-3xl border-4 border-arse-pink bg-white",
        PERSONA_CHAT_SHELL_CLASS,
        className
      )}
    >
      {onCollapseColumn ? (
        <button
          type="button"
          onClick={onCollapseColumn}
          aria-label="Collapse personas column"
          className="absolute left-3 top-3 z-10 inline-flex items-center justify-center rounded-xl border-2 border-arse-black bg-white px-2.5 py-1.5 text-arse-black shadow-[3px_3px_0_0_var(--arse-pink)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_var(--arse-pink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink sm:left-4 sm:top-4"
        >
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}
      <ProjectSidebarTabs {...tabsProps} className="min-h-0 flex-1" />
    </div>
  )
}
