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
  const { getClientForUser, getVisibleProjects } = useAuth()
  const project = useMemo(
    () => getVisibleProjects().find((p) => p.id === id),
    [getVisibleProjects, id]
  )
  const client = getClientForUser()
  const remaining = client ? client.totalCredits - client.usedCredits : 0
  const total = client?.totalCredits ?? 0

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
            {client ? (
              <div className="w-full rounded-xl border-2 border-arse-black bg-arse-magenta px-3 py-2 sm:px-4">
                <span className="font-arse-title text-xs font-bold uppercase tracking-wider text-arse-black">
                  Credits
                </span>
                <div className="mt-2 flex items-center gap-2 rounded-full border-2 border-arse-black bg-arse-black px-3 py-1.5 text-arse-white">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-arse-white/40 text-[10px] font-bold">
                    AI
                  </span>
                  <div className="flex flex-1 flex-wrap items-center justify-center gap-2 text-center font-arse-body text-xs font-semibold sm:justify-between sm:text-left">
                    <span>Remaining {remaining}</span>
                    <span className="hidden h-4 w-px bg-arse-white/40 sm:block" aria-hidden />
                    <span>Total {total}</span>
                  </div>
                </div>
              </div>
            ) : null}
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
