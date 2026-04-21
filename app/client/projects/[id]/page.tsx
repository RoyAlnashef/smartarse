"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react"
import Link from "next/link"
import { Coins, Plus } from "lucide-react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import type { ChatResultForClient } from "@/lib/api/chat-payload"
import { useAuth } from "@/lib/auth-context"
import { uploadedFiles, conversations as mockConversations } from "@/lib/mock-data"
import { chatMessagesFromStoredResult } from "@/lib/chat-thread"
import { getChatResult } from "@/lib/chat-result"
import { MOCK_CHAT_HISTORY } from "@/lib/mock-chat-history"
import { useChatHistory } from "@/hooks/useChatHistory"
import {
  useChatQuestion,
  type ChatProjectDocumentWebhookItem,
} from "@/hooks/useChatQuestion"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { listProjectDocuments } from "@/lib/supabase/documents"
import { CREDIT_BALANCE_WARNING_THRESHOLD } from "@/components/dashboard/project-credits-meter"
import { ProjectPausedContactMessage } from "@/components/client/project-paused-contact-message"
import { isAccessDateExpired, isProjectLiveForChat } from "@/lib/project-status"
import { getProjectById } from "@/lib/supabase/projects"
import { cn } from "@/lib/utils"
import type { HistoryItem } from "@/lib/chat-history-types"
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
import { SourcesSelector } from "@/components/client/project-detail/sources-selector"
import { ChatHistoryCard } from "@/components/client/project-detail/chat-history-card"
import { ProjectChat } from "@/components/client/project-detail/project-chat"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"

const MOCK_HISTORY_PAGE_SIZE = 5
const MOCK_CHAT_REPLY_MS = 750

function dedupeHistoryByQuery(items: HistoryItem[]): HistoryItem[] {
  const seen = new Set<string>()
  const out: HistoryItem[] = []
  for (const it of items) {
    const k = it.user_query.trim().toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(it)
  }
  return out
}

const WORKSPACE_INTERACTIVE_SELECTOR =
  'button, a[href], [role="button"], [role="tab"], textarea, input, select, label[for]'

export default function ClientProjectDetailPage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""
  const { user, getVisibleProjects } = useAuth()

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

  const {
    history: apiHistory,
    loading: apiHistoryLoading,
    error: apiHistoryError,
    refresh: refreshChatHistory,
  } = useChatHistory({
    projectId: id,
    enabled: useRemoteDetail && !!id,
  })

  const [sessionHistoryItems, setSessionHistoryItems] = useState<HistoryItem[]>(
    []
  )
  const [chatHistoryUIPage, setChatHistoryUIPage] = useState(1)
  const prevSessionHistoryCountRef = useRef(0)

  useEffect(() => {
    setSessionHistoryItems([])
  }, [id])

  useEffect(() => {
    setChatHistoryUIPage(1)
  }, [id])

  useEffect(() => {
    if (sessionHistoryItems.length > prevSessionHistoryCountRef.current) {
      setChatHistoryUIPage(1)
    }
    prevSessionHistoryCountRef.current = sessionHistoryItems.length
  }, [sessionHistoryItems.length])

  const historyBaseList = useMemo(() => {
    if (useRemoteDetail) {
      return apiHistoryError ? [] : apiHistory
    }
    return MOCK_CHAT_HISTORY
  }, [useRemoteDetail, apiHistoryError, apiHistory])

  const mergedChatHistory = useMemo(() => {
    if (useRemoteDetail) {
      return historyBaseList
    }
    return dedupeHistoryByQuery([...sessionHistoryItems, ...historyBaseList])
  }, [useRemoteDetail, sessionHistoryItems, historyBaseList])

  const chatHistoryTotalPages = Math.max(
    1,
    Math.ceil(mergedChatHistory.length / MOCK_HISTORY_PAGE_SIZE)
  )

  const chatHistorySlice = useMemo(() => {
    const start = (chatHistoryUIPage - 1) * MOCK_HISTORY_PAGE_SIZE
    return mergedChatHistory.slice(start, start + MOCK_HISTORY_PAGE_SIZE)
  }, [mergedChatHistory, chatHistoryUIPage])

  const chatHistoryPagination = useMemo(
    () => ({
      page: chatHistoryUIPage,
      pageSize: MOCK_HISTORY_PAGE_SIZE,
      totalItems: mergedChatHistory.length,
      totalPages: chatHistoryTotalPages,
    }),
    [chatHistoryUIPage, mergedChatHistory.length, chatHistoryTotalPages]
  )

  const showHistoryLoading = Boolean(
    useRemoteDetail &&
      apiHistoryLoading &&
      apiHistory.length === 0 &&
      !apiHistoryError
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

  const appendMockAssistantAndHistory = useCallback(
    (rawQuestion: string) => {
      const question = rawQuestion.trim()
      if (!question) return
      const rid = crypto.randomUUID()
      window.setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${crypto.randomUUID()}`,
            conversationId: `conv-${id}`,
            role: "assistant",
            content:
              "Here’s a quick demo reply — in production this comes back from your n8n workflow.",
            timestamp: new Date().toISOString(),
          },
        ])
        setSessionHistoryItems((prev) => [
          {
            id: -Date.now(),
            request_id: rid,
            user_query: question,
            created_at: new Date().toISOString(),
            status: "complete",
          },
          ...prev,
        ])
      }, MOCK_CHAT_REPLY_MS)
    },
    [id]
  )

  const [activeThreadRequestId, setActiveThreadRequestId] = useState<
    string | null
  >(null)
  const [historyLoadingRequestId, setHistoryLoadingRequestId] = useState<
    string | null
  >(null)

  useEffect(() => {
    setActiveThreadRequestId(null)
  }, [id])

  const onChatResult = useCallback(
    (
      result: ChatResultForClient,
      question: string,
      meta?: { threadAnchorRequestId?: string; jobRequestId: string }
    ) => {
      const text = result.answer.trim() || "No answer returned."
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${crypto.randomUUID()}`,
          conversationId: `conv-${id}`,
          role: "assistant",
          content: text,
          timestamp: new Date().toISOString(),
          citations: result.sources,
        },
      ])
      if (useRealChat && meta?.jobRequestId && !meta.threadAnchorRequestId) {
        setActiveThreadRequestId(meta.jobRequestId)
      }
      const q = question.trim()
      if (!useRealChat && q) {
        setSessionHistoryItems((prev) => [
          {
            id: -Date.now(),
            request_id: crypto.randomUUID(),
            user_query: q,
            created_at: new Date().toISOString(),
            status: "complete",
          },
          ...prev,
        ])
      }
    },
    [id, useRealChat]
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

  const projectDocumentsForWebhook = useMemo((): ChatProjectDocumentWebhookItem[] => {
    return readyDocuments.map((f) => ({
      id: f.id,
      name: f.name,
      display_name:
        f.displayName && f.displayName.trim() ? f.displayName.trim() : null,
    }))
  }, [readyDocuments])
  const [personaEvents, setPersonaEvents] = useState<
    (PersonaActivatedEvent | PersonaEndedEvent)[]
  >([])
  const [appliedPersonaId, setAppliedPersonaId] = useState<string | null>(null)
  const [mobilePersonasOpen, setMobilePersonasOpen] = useState(false)
  const [desktopPersonasCollapsed, setDesktopPersonasCollapsed] =
    useState(false)

  const handleOpenPersonasControls = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches &&
      desktopPersonasCollapsed
    ) {
      setDesktopPersonasCollapsed(false)
      return
    }
    setMobilePersonasOpen(true)
  }, [desktopPersonasCollapsed])

  useEffect(() => {
    if (!desktopPersonasCollapsed) setMobilePersonasOpen(false)
  }, [desktopPersonasCollapsed])

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

  const handleHistoryItemSelect = useCallback(
    async (item: HistoryItem) => {
      if (useRealChat) {
        setHistoryLoadingRequestId(item.request_id)
        try {
          const row = await getChatResult(item.request_id, id)
          const loaded = chatMessagesFromStoredResult({
            user_query: row.user_query,
            created_at: row.created_at,
            result_payload: row.result_payload,
            conversationId: `conv-${id}`,
          })
          setMessages(
            loaded.map((m) => ({
              ...m,
              documentIds: m.role === "user" ? sourceDocumentIds : undefined,
            }))
          )
          setActiveThreadRequestId(row.request_id)
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Failed to load conversation"
          )
        } finally {
          setHistoryLoadingRequestId(null)
        }
        return
      }

      const ts = new Date().toISOString()
      setActiveThreadRequestId(null)
      setMessages([
        {
          id: `msg-${crypto.randomUUID()}`,
          conversationId: `conv-${id}`,
          role: "user",
          content: item.user_query,
          timestamp: ts,
          documentIds: sourceDocumentIds,
        },
        {
          id: `msg-${crypto.randomUUID()}`,
          conversationId: `conv-${id}`,
          role: "assistant",
          content:
            "Demo mode: connect Supabase and n8n to load saved answers for this thread.",
          timestamp: ts,
        },
      ])
    },
    [id, sourceDocumentIds, useRealChat]
  )

  const handleNewChat = useCallback(() => {
    setActiveThreadRequestId(null)
    setMessages([])
  }, [])

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

  const creditsLow = project.totalCredits < CREDIT_BALANCE_WARNING_THRESHOLD

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
          className="min-w-0 truncate font-arse-title text-sm font-bold tracking-tight text-arse-black"
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

      <div
        className={cn(
          "mt-6 grid grid-cols-1 items-start gap-6 lg:gap-8",
          desktopPersonasCollapsed
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]"
            : "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]"
        )}
      >
          <aside className="min-w-0 space-y-6">
            <button
              type="button"
              onClick={handleNewChat}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-arse-black bg-white px-4 py-2.5 font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black shadow-[3px_3px_0_0_var(--arse-pink)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_var(--arse-pink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
              New chat
            </button>
            <ChatHistoryCard
              items={chatHistorySlice}
              pagination={chatHistoryPagination}
              page={chatHistoryUIPage}
              loading={showHistoryLoading}
              onFetchPage={(p) => {
                setChatHistoryUIPage((prev) => {
                  const next = Math.min(
                    Math.max(1, p),
                    chatHistoryTotalPages
                  )
                  return next === prev ? prev : next
                })
              }}
              onHistoryItemSelect={handleHistoryItemSelect}
              loadingRequestId={historyLoadingRequestId}
              selectedRequestId={activeThreadRequestId}
              disableSelect={useRealChat ? chatLoading : false}
            />
            <SourcesSelector files={readyDocuments} />
            {project?.accessUntil ? (
              <Alert
                className={cn(
                  "rounded-3xl border-2 py-3 shadow-none [&>svg~*]:pl-0",
                  isAccessDateExpired(project.accessUntil)
                    ? "border-arse-pink/80 bg-arse-pink/10 text-foreground"
                    : "border-border bg-muted/40 text-muted-foreground"
                )}
                role="status"
              >
                <AlertDescription
                  className={cn(
                    "text-center font-arse-body text-sm",
                    isAccessDateExpired(project.accessUntil)
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {isAccessDateExpired(project.accessUntil) ? (
                    <>
                      Access to this project has ended. Ask{" "}
                      <span className="font-semibold text-foreground">
                        {project.clientName || "your organization"}
                      </span>{" "}
                      for an extension if you need continued access.
                    </>
                  ) : (
                    <>
                      Access until{" "}
                      {format(
                        parseISO(`${project.accessUntil}T12:00:00`),
                        "MMM d, yyyy"
                      )}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            ) : null}
            {creditsLow ? (
              <div
                className="px-1 text-center"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Coins
                    className="h-3 w-3 shrink-0 text-amber-600/70 dark:text-amber-400/80"
                    aria-hidden
                  />
                  <span className="font-arse-body text-[11px] text-arse-black/50 dark:text-arse-white/50">
                    Credits running low
                  </span>
                </div>
              </div>
            ) : null}
          </aside>

          <div
            className="order-first min-h-0 min-w-0 lg:order-none"
            onPointerDownCapture={handleWorkspacePointerDownCapture}
          >
            <ProjectChat
              messages={messages}
              personaEvents={personaEvents}
              citationDocuments={readyDocuments}
              userName={user?.name}
              isLoading={useRealChat ? chatLoading : false}
              appliedPersonaId={appliedPersonaId}
              disabled={
                useRealChat &&
                (chatLoading ||
                  historyLoadingRequestId != null ||
                  (project ? !isProjectLiveForChat(project.status) : true))
              }
              personasColumnCollapsed={desktopPersonasCollapsed}
              onOpenPersonas={handleOpenPersonasControls}
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
                  const prior = messages.filter(
                    (m) => m.role === "user" || m.role === "assistant"
                  )
                  const chatHistoryForWebhook = [...prior, userMsg].map(
                    (m) => ({
                      role: m.role,
                      content: m.content,
                    })
                  )
                  setMessages((prev) => [...prev, userMsg])
                  void submitQuestion(content, {
                    threadAnchorRequestId: activeThreadRequestId,
                    chatHistoryForWebhook: activeThreadRequestId
                      ? chatHistoryForWebhook
                      : undefined,
                    projectDocumentsForWebhook,
                  })
                  return
                }
                setMessages((prev) => [...prev, userMsg])
                appendMockAssistantAndHistory(content)
              }}
            />
          </div>

          {!desktopPersonasCollapsed ? (
            <div
              className="hidden min-h-0 min-w-0 lg:block"
              onPointerDownCapture={handleWorkspacePointerDownCapture}
            >
              <ProjectRightSidebar
                appliedPersona={appliedPersona}
                onApplyPersona={handleApplyPersona}
                onClearPersona={handleClearPersona}
                onCollapseColumn={() => setDesktopPersonasCollapsed(true)}
              />
            </div>
          ) : null}
        </div>

        <MobilePersonaDrawer
          open={mobilePersonasOpen}
          onOpenChange={setMobilePersonasOpen}
          appliedPersona={appliedPersona}
          onApply={handleApplyPersona}
          onClearPersona={handleClearPersona}
          onSidebarPointerDownCapture={
            workspaceChatBlocked ? handleWorkspacePointerDownCapture : undefined
          }
        />
    </div>
  )
}
