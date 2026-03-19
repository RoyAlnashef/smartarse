"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import aiCoin from "@/public/ai-coin.png"
import { useAuth } from "@/lib/auth-context"
import { uploadedFiles, conversations as mockConversations } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type {
  ChatMessage,
  PersonaActivatedEvent,
  PersonaEndedEvent,
} from "@/lib/types"
import { MOCK_SEGMENT_PERSONAS } from "@/components/client/project-detail/persona-drawer"
import { MobilePersonaDrawer } from "@/components/client/project-detail/mobile-persona-drawer"
import { PersonasColumn } from "@/components/client/project-detail/personas-column"
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
  const [personaEvents, setPersonaEvents] = useState<
    (PersonaActivatedEvent | PersonaEndedEvent)[]
  >([])
  const [appliedPersonaId, setAppliedPersonaId] = useState<string | null>(null)
  const [personasColumnCollapsed, setPersonasColumnCollapsed] = useState(false)
  const [mobilePersonasOpen, setMobilePersonasOpen] = useState(false)

  const appliedPersona = useMemo(
    () =>
      appliedPersonaId
        ? (MOCK_SEGMENT_PERSONAS.find((p) => p.id === appliedPersonaId) ?? null)
        : null,
    [appliedPersonaId]
  )

  function handleApplyPersona(personaId: string) {
    setAppliedPersonaId(personaId)
    setPersonaEvents((prev) => [
      ...prev,
      {
        id: `persona-${Date.now()}`,
        type: "persona_activated",
        timestamp: new Date().toISOString(),
        personaId,
      },
    ])
  }

  function handleClearPersona() {
    const id = appliedPersonaId
    if (!id) return
    setAppliedPersonaId(null)
    setPersonaEvents((prev) => [
      ...prev,
      {
        id: `persona-ended-${Date.now()}`,
        type: "persona_ended",
        timestamp: new Date().toISOString(),
        personaId: id,
      },
    ])
  }

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

      <div
        className={cn(
          "mt-6 grid items-start gap-6 lg:gap-8",
          personasColumnCollapsed
            ? "lg:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)_minmax(3rem,3.5rem)]"
            : "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]"
        )}
      >
          <aside className="min-w-0 space-y-6">
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
              appliedPersonaId={appliedPersonaId}
              onOpenPersonas={() => setMobilePersonasOpen(true)}
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

          <div className="hidden min-h-0 min-w-0 lg:block">
            <PersonasColumn
              collapsed={personasColumnCollapsed}
              onToggleCollapsed={setPersonasColumnCollapsed}
              appliedPersonaId={appliedPersonaId}
              onApplyPersona={handleApplyPersona}
              onClearPersona={handleClearPersona}
            />
          </div>
        </div>

        <MobilePersonaDrawer
          open={mobilePersonasOpen}
          onOpenChange={setMobilePersonasOpen}
          appliedPersona={appliedPersona}
          onApply={handleApplyPersona}
          onClearPersona={handleClearPersona}
        />
    </div>
  )
}
