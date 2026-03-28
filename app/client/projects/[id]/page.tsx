"use client"

import { useCallback, useEffect, useMemo, useState, type PointerEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import aiCoin from "@/public/ai-coin.png"
import type { ChatResultForClient } from "@/lib/api/chat-payload"
import { useAuth } from "@/lib/auth-context"
import { uploadedFiles, conversations as mockConversations } from "@/lib/mock-data"
import { MOCK_CHAT_HISTORY } from "@/lib/mock-chat-history"
import { useChatHistory } from "@/hooks/useChatHistory"
import { useChatQuestion } from "@/hooks/useChatQuestion"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { listProjectDocuments } from "@/lib/supabase/documents"
import { ProjectPausedContactMessage } from "@/components/client/project-paused-contact-message"
import { isProjectLiveForChat } from "@/lib/project-status"
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
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"

const WORKSPACE_INTERACTIVE_SELECTOR =
  'button, a[href], [role="button"], [role="tab"], textarea, input, select, label[for]'

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
    if (useRemoteDetail) return []
    const first = mockConversations.find((c) => c.projectId === id)
    return first?.messages ?? []
  }, [id, useRemoteDetail])

  const [messages, setMessages] = useState<ChatMessage[]>([])
  useEffect(() => {
    setMessages(seededMessages)
  }, [seededMessages])

  const { history: apiHistory, refresh: refreshChatHistory } = useChatHistory({
    projectId: id,
    enabled: useRemoteDetail && !!id,
  })

  const chatHistoryItems = useMemo(
    () => (useRemoteDetail ? apiHistory : [...MOCK_CHAT_HISTORY]),
    [useRemoteDetail, apiHistory]
  )

  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())
  useEffect(() => {
    setSessionId(crypto.randomUUID())
  }, [id])

  const orgSettings = useMemo(
    () => ({
      weighted: false,
      data_source_mode: "default",
      qual_enabled: false,
    }),
    []
  )

  const orgId = project?.clientId ?? user?.clientId ?? ""
  const useRealChat = Boolean(useRemoteDetail && project && orgId)

  const workspaceChatBlocked =
    Boolean(useRealChat && project && !isProjectLiveForChat(project.status))

  const [blockedPopoverOpen, setBlockedPopoverOpen] = useState(false)
  const [popoverAnchor, setPopoverAnchor] = useState<{
    left: number
    top: number
  } | null>(null)

  const handleWorkspacePointerDownCapture = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!workspaceChatBlocked) return
      const target = e.target
      if (!(target instanceof Element)) return
      if (target.closest("[data-radix-popover-content]")) return

      const clickable = target.closest(WORKSPACE_INTERACTIVE_SELECTOR)
      if (!clickable) return

      e.preventDefault()
      e.stopPropagation()

      const el = clickable as HTMLElement
      const rect = el.getBoundingClientRect()
      setPopoverAnchor({
        left: Math.round(rect.left + rect.width / 2),
        top: Math.round(rect.top),
      })
      setBlockedPopoverOpen(true)
    },
    [workspaceChatBlocked]
  )

  const refreshHistory = useCallback(() => {
    void refreshChatHistory()
  }, [refreshChatHistory])

  const onChatResult = useCallback(
    (result: ChatResultForClient) => {
      const text = result.answer.trim() || "No answer returned."
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${crypto.randomUUID()}`,
          conversationId: `conv-${id}`,
          role: "assistant",
          content: text,
          timestamp: new Date().toISOString(),
        },
      ])
    },
    [id]
  )

  const { submitQuestion, loading: chatLoading, error: chatError } =
    useChatQuestion({
      orgId,
      userId: user?.id ?? "",
      projectId: id,
      projectStatus: project?.status ?? "live",
      sessionId,
      orgSettings,
      onResult: onChatResult,
      onHistoryRefresh: refreshHistory,
    })

  useEffect(() => {
    if (chatError) toast.error(chatError)
  }, [chatError])

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

  const handleHistoryQuestionSelect = useCallback(
    (question: string) => {
      const ts = new Date().toISOString()
      const userMsg: ChatMessage = {
        id: `msg-${crypto.randomUUID()}`,
        conversationId: `conv-${id}`,
        role: "user",
        content: question,
        timestamp: ts,
        documentIds: sourceDocumentIds,
      }
      if (useRealChat) {
        setMessages((prev) => [...prev, userMsg])
        void submitQuestion(question)
        return
      }
      setMessages((prev) => [...prev, userMsg])
    },
    [id, sourceDocumentIds, submitQuestion, useRealChat]
  )

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
    <div className="w-full px-4 pb-12 pt-6 sm:px-6 lg:px-8">
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

      {workspaceChatBlocked ? (
        <Popover
          open={blockedPopoverOpen}
          onOpenChange={(open) => {
            setBlockedPopoverOpen(open)
            if (!open) setPopoverAnchor(null)
          }}
        >
          <PopoverAnchor asChild>
            <span
              aria-hidden
              className="pointer-events-none fixed z-[60] block h-0 w-0"
              style={{
                left: popoverAnchor?.left ?? 0,
                top: popoverAnchor?.top ?? 0,
              }}
            />
          </PopoverAnchor>
          <PopoverContent
            side="top"
            align="center"
            sideOffset={8}
            className="z-[70] max-w-xs border-amber-200 bg-amber-50 text-center text-sm text-amber-950 shadow-md dark:border-amber-900/50 dark:bg-amber-950/90 dark:text-amber-50"
            onOpenAutoFocus={(ev) => ev.preventDefault()}
          >
            <ProjectPausedContactMessage />
          </PopoverContent>
        </Popover>
      ) : null}

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

          <div
            className="order-first min-h-0 min-w-0 lg:order-none"
            onPointerDownCapture={handleWorkspacePointerDownCapture}
          >
            <ProjectChat
              messages={messages}
              personaEvents={personaEvents}
              appliedPersonaId={appliedPersonaId}
              disabled={
                useRealChat &&
                (chatLoading ||
                  (project ? !isProjectLiveForChat(project.status) : true))
              }
              onOpenPersonas={() => setMobilePersonasOpen(true)}
              onSend={(content) => {
                const ts = new Date().toISOString()
                const userMsg: ChatMessage = {
                  id: `msg-${crypto.randomUUID()}`,
                  conversationId: `conv-${id}`,
                  role: "user",
                  content,
                  timestamp: ts,
                  documentIds: sourceDocumentIds,
                }
                if (useRealChat) {
                  setMessages((prev) => [...prev, userMsg])
                  void submitQuestion(content)
                  return
                }
                setMessages((prev) => [...prev, userMsg])
              }}
            />
          </div>

          <div
            className="hidden min-h-0 min-w-0 lg:block"
            onPointerDownCapture={handleWorkspacePointerDownCapture}
          >
            <ProjectRightSidebar
              appliedPersona={appliedPersona}
              onApplyPersona={handleApplyPersona}
              onClearPersona={handleClearPersona}
              onHistoryQuestionSelect={handleHistoryQuestionSelect}
              chatHistoryItems={chatHistoryItems}
              chatRequestLoading={useRealChat ? chatLoading : undefined}
            />
          </div>
        </div>

        <MobilePersonaDrawer
          open={mobilePersonasOpen}
          onOpenChange={setMobilePersonasOpen}
          appliedPersona={appliedPersona}
          onApply={handleApplyPersona}
          onClearPersona={handleClearPersona}
          onHistoryQuestionSelect={handleHistoryQuestionSelect}
          chatHistoryItems={chatHistoryItems}
          chatRequestLoading={useRealChat ? chatLoading : undefined}
          onSidebarPointerDownCapture={
            workspaceChatBlocked ? handleWorkspacePointerDownCapture : undefined
          }
        />
    </div>
  )
}
