"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import aiCoin from "@/public/ai-coin.png"
import { useAuth } from "@/lib/auth-context"
import { uploadedFiles, conversations as mockConversations } from "@/lib/mock-data"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { listProjectDocuments } from "@/lib/supabase/documents"
import { getProjectById } from "@/lib/supabase/projects"
import type {
  ChatMessage,
  PersonaActivatedEvent,
  PersonaEndedEvent,
  Project,
  UploadedFile,
} from "@/lib/types"
import { ClientProjectDetailSkeleton } from "@/components/client/project-detail/client-project-detail-skeleton"
import { MOCK_SEGMENT_PERSONAS } from "@/components/client/project-detail/persona-drawer"
import { MobilePersonaDrawer } from "@/components/client/project-detail/mobile-persona-drawer"
import { ProjectRightSidebar } from "@/components/client/project-detail/project-right-sidebar"
import { ProjectDetailCard } from "@/components/client/project-detail/project-detail-card"
import { SourcesSelector } from "@/components/client/project-detail/sources-selector"
import { ProjectChat } from "@/components/client/project-detail/project-chat"

export default function ClientProjectDetailPage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""
  const { user, getClientForUser, getVisibleProjects } = useAuth()

  const mockProject = useMemo(
    () => getVisibleProjects().find((p) => p.id === id) ?? null,
    [getVisibleProjects, id]
  )

  const useRemoteDetail = !!getSupabaseBrowserClient() && !!user
  const [remoteProject, setRemoteProject] = useState<Project | null | undefined>(
    undefined
  )

  useEffect(() => {
    if (!user) {
      setRemoteProject(undefined)
      return
    }
    if (!getSupabaseBrowserClient()) {
      setRemoteProject(undefined)
      return
    }
    if (!id) {
      setRemoteProject(null)
      return
    }

    let cancelled = false
    setRemoteProject(undefined)

    getProjectById(id)
      .then((proj) => {
        if (!cancelled) setRemoteProject(proj)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "Failed to load project"
          )
          setRemoteProject(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id, user?.id, user?.role])

  const loadingRemote = useRemoteDetail && remoteProject === undefined
  const project = useRemoteDetail
    ? remoteProject === undefined
      ? undefined
      : remoteProject
    : mockProject

  const client = getClientForUser()
  const remaining = client ? client.totalCredits - client.usedCredits : 0
  const total = client?.totalCredits ?? 0
  // Mocked for now (demo UI). In a real app this would come from the billing model.
  const accessUntil = "Jun 30, 2026"

  const [remoteDocuments, setRemoteDocuments] = useState<
    UploadedFile[] | undefined
  >(undefined)
  useEffect(() => {
    if (!useRemoteDetail || !user) {
      setRemoteDocuments(undefined)
      return
    }
    let cancelled = false
    setRemoteDocuments(undefined)
    listProjectDocuments(id)
      .then((list) => {
        if (!cancelled) setRemoteDocuments(list)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "Failed to load documents"
          )
          setRemoteDocuments([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, user?.id, useRemoteDetail])

  const resolvedProjectDocuments = useMemo(
    () =>
      useRemoteDetail
        ? (remoteDocuments ?? [])
        : uploadedFiles.filter((f) => f.projectId === id),
    [id, remoteDocuments, useRemoteDetail]
  )
  const readyDocuments = useMemo(
    () => resolvedProjectDocuments.filter((f) => f.status === "ready"),
    [resolvedProjectDocuments]
  )
  const seededMessages = useMemo<ChatMessage[]>(() => {
    const first = mockConversations.find((c) => c.projectId === id)
    return first?.messages ?? []
  }, [id])

  const [messages, setMessages] = useState<ChatMessage[]>([])
  useEffect(() => {
    setMessages(seededMessages)
  }, [seededMessages])

  const sourceDocumentIds = useMemo(
    () => readyDocuments.map((f) => f.id),
    [readyDocuments]
  )
  const [personaEvents, setPersonaEvents] = useState<
    (PersonaActivatedEvent | PersonaEndedEvent)[]
  >([])
  const [appliedPersonaId, setAppliedPersonaId] = useState<string | null>(null)
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
    const clearedId = appliedPersonaId
    if (!clearedId) return
    setAppliedPersonaId(null)
    setPersonaEvents((prev) => [
      ...prev,
      {
        id: `persona-ended-${Date.now()}`,
        type: "persona_ended",
        timestamp: new Date().toISOString(),
        personaId: clearedId,
      },
    ])
  }

  if (loadingRemote) {
    return <ClientProjectDetailSkeleton />
  }

  if (!project) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-arse-title text-lg font-bold text-arse-pink">Project not found</p>
        <Link
          href="/client/projects"
          className="mt-6 inline-block font-arse-title text-sm font-bold uppercase tracking-wide text-arse-black underline decoration-arse-pink decoration-2 underline-offset-4 hover:text-arse-pink"
        >
          Back to projects
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1"
      >
        <Link
          href="/client/projects"
          className="shrink-0 font-arse-body text-sm font-medium text-arse-black/70 hover:text-arse-pink"
        >
          ← Projects
        </Link>
        <span
          className="select-none font-arse-body text-sm text-arse-black/35"
          aria-hidden
        >
          /
        </span>
        <span
          className="min-w-0 truncate font-arse-title text-sm font-bold uppercase tracking-wide text-arse-black"
          title={project.name}
          aria-current="page"
        >
          {project.name}
        </span>
      </nav>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] lg:gap-8">
          <aside className="min-w-0 space-y-6">
            {client ? (
              <section className="w-full overflow-hidden rounded-3xl bg-arse-cyan">
                <div className="bg-arse-pink px-4 py-2 text-center font-arse-title text-xs font-bold uppercase tracking-[0.35em] text-arse-white">
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
            <SourcesSelector files={readyDocuments} />
          </aside>

          <div className="order-first min-h-0 min-w-0 lg:order-none">
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
                    documentIds: sourceDocumentIds,
                  },
                ])
              }}
            />
          </div>

          <div className="hidden min-h-0 min-w-0 lg:block">
            <ProjectRightSidebar
              appliedPersona={appliedPersona}
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
