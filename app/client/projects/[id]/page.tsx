"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import aiCoin from "@/public/ai-coin.png"
import { useAuth } from "@/lib/auth-context"
import { uploadedFiles, conversations as mockConversations } from "@/lib/mock-data"
import type { ChatMessage, PersonaActivatedEvent } from "@/lib/types"
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
  // Mocked for now (demo UI). In a real app this would come from the billing model.
  const accessUntil = "Jun 30, 2026"

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
  const [personaEvents, setPersonaEvents] = useState<PersonaActivatedEvent[]>([])

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
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <Link
        href="/client/projects"
        className="font-arse-body text-sm font-medium text-arse-black/70 hover:text-arse-magenta"
      >
        ← Projects
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[20rem,1fr] lg:gap-8">
          <aside className="space-y-6">
            {client ? (
              <section className="w-full overflow-hidden rounded-3xl bg-arse-cyan">
                <div className="bg-arse-magenta px-4 py-2 text-center font-arse-title text-xs font-bold uppercase tracking-[0.35em] text-arse-white">
                  CREDITS
                </div>
                <div className="px-4 py-4">
                  <div className="rounded-2xl bg-arse-cyan text-arse-black">
                    <div className="grid grid-cols-2 items-start text-left">
                      <div className="border-r border-arse-black/20 pr-4">
                        <div className="flex items-start gap-3">
                          <span className="relative mt-0.5 h-10 w-10 shrink-0">
                            <Image
                              src={aiCoin}
                              alt="AI credits"
                              fill
                              className="object-contain"
                              sizes="40px"
                              priority
                            />
                          </span>
                          <div>
                            <p className="font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black/65">
                              Remaining
                            </p>
                            <p className="font-arse-title text-[16px] font-bold text-arse-black">
                              {remaining}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pl-4">
                        <p className="font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black/65">
                          Total
                        </p>
                        <p className="font-arse-title text-[16px] font-bold text-arse-black">
                          {total}
                        </p>
                      </div>
                    </div>

                    <div className="my-3 h-px w-full bg-arse-black/20" aria-hidden />

                    <p className="text-center font-arse-body text-xs font-bold text-arse-black/70">
                      <span className="font-arse-title font-normal">
                        Access until
                      </span>{" "}
                      {accessUntil}
                    </p>
                  </div>
                </div>
              </section>
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

          <div className="min-h-0 min-w-0">
            <ProjectChat
              messages={messages}
              personaEvents={personaEvents}
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
              onPersonaActivated={(personaId) => {
                setPersonaEvents((prev) => [
                  ...prev,
                  {
                    id: `persona-${Date.now()}`,
                    type: "persona_activated",
                    timestamp: new Date().toISOString(),
                    personaId,
                  },
                ])
              }}
            />
          </div>
        </div>
    </div>
  )
}
