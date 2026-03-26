"use client"

import { cn } from "@/lib/utils"
import { PERSONA_CHAT_SHELL_CLASS } from "@/components/client/project-detail/persona-chat-shell-classes"
import {
  ProjectSidebarTabs,
  type ProjectSidebarTabsProps,
} from "@/components/client/project-detail/project-sidebar-tabs"

export type ProjectRightSidebarProps = ProjectSidebarTabsProps

export function ProjectRightSidebar({ className, ...props }: ProjectRightSidebarProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-3xl border-4 border-arse-pink bg-white",
        PERSONA_CHAT_SHELL_CLASS,
        className
      )}
    >
      <ProjectSidebarTabs {...props} className="min-h-0 flex-1" />
    </div>
  )
}
