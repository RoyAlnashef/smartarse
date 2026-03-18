"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { uploadedFiles, conversations as mockConversations } from "@/lib/mock-data"
import type { ChatMessage } from "@/lib/types"
import { ProjectDetailCard } from "@/components/client/project-detail/project-detail-card"
import { SourcesSelector } from "@/components/client/project-detail/sources-selector"
import { ProjectChat } from "@/components/client/project-detail/project-chat"

export default function ClientProjectDetailPage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""
  const { getVisibleProjects } = useAuth()
  const project = useMemo(
    () => getVisibleProjects().find((p) => p.id === id),
    [getVisibleProjects, id]
  )

  const projectFiles = useMemo(
    () => uploadedFiles.filter((f) => f.projectId === id),
    [id]
  )
  const seededMessages = useMemo<ChatMessage[]>(() => {
    const first = mockConversations.find((c) => c.projectId === id)
    return first?.messages ?? []
  }, [id])

  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(
    () => new Set(projectFiles.filter((f) => f.status === "ready").map((f) => f.id))
  )
  const [messages, setMessages] = useState<ChatMessage[]>(seededMessages)

  if (!project) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-arse-title text-lg font-bold text-arse-magenta">Project not found</p>
        <Link
          href="/client/projects"
          className="mt-6 inline-block font-arse-title text-sm font-bold uppercase tracking-wide text-arse-black underline decoration-arse-magenta decoration-2 underline-offset-4 hover:text-arse-magenta"
        >
          Back to projects
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/client/projects"
          className="font-arse-body text-sm font-medium text-arse-black/70 hover:text-arse-magenta"
        >
          ← Projects
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[20rem,1fr] lg:gap-8">
          <aside className="space-y-6">
            <ProjectDetailCard project={project} />
            <SourcesSelector
              files={projectFiles}
              selected={selectedDocs}
              onToggle={(fileId) => {
                setSelectedDocs((prev) => {
                  const next = new Set(prev)
                  if (next.has(fileId)) next.delete(fileId)
                  else next.add(fileId)
                  return next
                })
              }}
            />
          </aside>

          <div className="min-w-0">
            <ProjectChat
              messages={messages}
              onSend={(content) => {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `msg-${Date.now()}`,
                    conversationId: `conv-${id}`,
                    role: "user",
                    content,
                    timestamp: new Date().toISOString(),
                    documentIds: Array.from(selectedDocs),
                  },
                ])
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
