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
import { chatHydrationFromStoredResult, isoOneMsBefore } from "@/lib/chat-thread"
import { getChatResult } from "@/lib/chat-result"
import { MOCK_CHAT_HISTORY } from "@/lib/mock-chat-history"
import { useChatHistory } from "@/hooks/useChatHistory"
import {
  useChatQuestion,
  type ChatProjectDocumentWebhookItem,
} from "@/hooks/useChatQuestion"
import {
  useFocusGroupRound,
  participantFromPersona,
} from "@/hooks/useFocusGroupRound"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { listProjectDocuments } from "@/lib/supabase/documents"
import { CREDIT_BALANCE_WARNING_THRESHOLD } from "@/components/dashboard/project-credits-meter"
import { ProjectPausedContactMessage } from "@/components/client/project-paused-contact-message"
import { isAccessDateExpired, isProjectLiveForChat } from "@/lib/project-status"
import { getProjectById } from "@/lib/supabase/projects"
import { cn } from "@/lib/utils"
import {
  buildWebhookBriefForCustomAudience,
  buildWebhookBriefForSegmentPersona,
} from "@/lib/persona-webhook-brief"
import { personaSegmentColorTokenForId } from "@/lib/theme/persona-segment-theme"
import { ghostCustomAudienceFromChatRow, isArchivedCustomAudienceId, isDraftCustomAudienceId } from "@/lib/chat-restore-custom-audience"
import type { HistoryItem } from "@/lib/chat-history-types"
import type {
  ChatTimelineItem,
  ChatMessage,
  FocusGroupCountryContext,
  FocusGroupResponse,
  FocusGroupRound,
  FocusGroupSession,
  Project,
  SavedCustomAudience,
  UploadedFile,
} from "@/lib/types"
import { ClientProjectDetailSkeleton } from "@/components/client/project-detail/client-project-detail-skeleton"
import { listProjectPersonas } from "@/lib/supabase/personas"
import { resolveSegmentPersonasFromFiles } from "@/lib/personas/segment-display"
import { isCanonicalSegmentId } from "@/lib/personas/canonical-segments"
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

  const [remotePersonas, setRemotePersonas] = useState<UploadedFile[] | undefined>(
    undefined
  )
  useEffect(() => {
    if (!useRemoteDetail || !user) {
      setRemotePersonas(undefined)
      return
    }
    let cancelled = false
    setRemotePersonas(undefined)
    listProjectPersonas(id)
      .then((list) => {
        if (!cancelled) setRemotePersonas(list)
      })
      .catch(() => {
        if (!cancelled) setRemotePersonas([])
      })
    return () => {
      cancelled = true
    }
  }, [id, user?.id, useRemoteDetail])

  const projectPersonaFiles = useMemo(
    () => (useRemoteDetail ? (remotePersonas ?? []) : []),
    [remotePersonas, useRemoteDetail]
  )

  const segmentPersonas = useMemo(
    () => resolveSegmentPersonasFromFiles(projectPersonaFiles),
    [projectPersonaFiles]
  )

  const [savedAudiencesForHistory, setSavedAudiencesForHistory] = useState<
    SavedCustomAudience[]
  >([])

  const handleSavedAudiencesHydrated = useCallback(
    (list: SavedCustomAudience[]) => {
      setSavedAudiencesForHistory(list)
    },
    []
  )

  const handleSavedAudienceUpsert = useCallback((audience: SavedCustomAudience) => {
    setSavedAudiencesForHistory((prev) => {
      const rest = prev.filter((r) => r.id !== audience.id)
      return [audience, ...rest]
    })
  }, [])

  const handleSavedAudienceDeleted = useCallback((audienceId: string) => {
    setSavedAudiencesForHistory((prev) => prev.filter((r) => r.id !== audienceId))
  }, [])

  useEffect(() => {
    if (!useRemoteDetail || !user || !id) {
      setSavedAudiencesForHistory([])
      return
    }
    let cancelled = false
    fetch(`/api/audience/saved?project_id=${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) return { audiences: [] as SavedCustomAudience[] }
        return res.json() as Promise<{ audiences?: SavedCustomAudience[] }>
      })
      .then((body) => {
        if (!cancelled) setSavedAudiencesForHistory(body.audiences ?? [])
      })
      .catch(() => {
        if (!cancelled) setSavedAudiencesForHistory([])
      })
    return () => {
      cancelled = true
    }
  }, [id, user, useRemoteDetail])

  const seededMessages = useMemo<ChatMessage[]>(() => {
    if (useRemoteDetail) return []
    const first = mockConversations.find((c) => c.projectId === id)
    return first?.messages ?? []
  }, [id, useRemoteDetail])

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [orderedTimelineItems, setOrderedTimelineItems] = useState<
    ChatTimelineItem[] | null
  >(null)
  useEffect(() => {
    setMessages(seededMessages)
  }, [seededMessages])

  const {
    history: apiHistory,
    pagination: apiHistoryPagination,
    page: apiHistoryPage,
    loading: apiHistoryLoading,
    error: apiHistoryError,
    fetch: fetchApiHistoryPage,
    refresh: refreshChatHistory,
  } = useChatHistory({
    projectId: id,
    enabled: useRemoteDetail && !!id,
  })

  const [sessionHistoryItems, setSessionHistoryItems] = useState<HistoryItem[]>(
    []
  )
  const [mockHistoryUIPage, setMockHistoryUIPage] = useState(1)
  const prevSessionHistoryCountRef = useRef(0)

  useEffect(() => {
    setSessionHistoryItems([])
  }, [id])

  useEffect(() => {
    setMockHistoryUIPage(1)
  }, [id])

  useEffect(() => {
    if (sessionHistoryItems.length > prevSessionHistoryCountRef.current) {
      setMockHistoryUIPage(1)
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

  const mockHistoryTotalPages = Math.max(
    1,
    Math.ceil(mergedChatHistory.length / MOCK_HISTORY_PAGE_SIZE)
  )

  const mockHistorySlice = useMemo(() => {
    const start = (mockHistoryUIPage - 1) * MOCK_HISTORY_PAGE_SIZE
    return mergedChatHistory.slice(start, start + MOCK_HISTORY_PAGE_SIZE)
  }, [mergedChatHistory, mockHistoryUIPage])

  const mockHistoryPagination = useMemo(
    () => ({
      page: mockHistoryUIPage,
      pageSize: MOCK_HISTORY_PAGE_SIZE,
      totalItems: mergedChatHistory.length,
      totalPages: mockHistoryTotalPages,
    }),
    [mockHistoryUIPage, mergedChatHistory.length, mockHistoryTotalPages]
  )

  const chatHistoryItems = useMemo(
    () => (useRemoteDetail ? apiHistory : mockHistorySlice),
    [useRemoteDetail, apiHistory, mockHistorySlice]
  )

  const chatHistoryPagination = useMemo(
    () => (useRemoteDetail ? apiHistoryPagination : mockHistoryPagination),
    [useRemoteDetail, apiHistoryPagination, mockHistoryPagination]
  )

  const chatHistoryPage = useMemo(
    () => (useRemoteDetail ? apiHistoryPage : mockHistoryUIPage),
    [useRemoteDetail, apiHistoryPage, mockHistoryUIPage]
  )

  const showHistoryLoading = Boolean(
    useRemoteDetail && apiHistoryLoading && !apiHistoryError
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
    setOrderedTimelineItems(null)
  }, [id])

  const onChatResult = useCallback(
    (
      result: ChatResultForClient,
      question: string,
      meta?: { threadAnchorRequestId?: string; jobRequestId: string }
    ) => {
      const text = result.answer.trim() || "No answer returned."
      const assistantMsg: ChatMessage = {
        id: `msg-${crypto.randomUUID()}`,
        conversationId: `conv-${id}`,
        role: "assistant",
        content: text,
        timestamp: new Date().toISOString(),
        citations: result.sources,
        ...(result.inlineCitations.length > 0
          ? { inlineCitations: result.inlineCitations }
          : {}),
      }
      setMessages((prev) => [...prev, assistantMsg])
      setOrderedTimelineItems((prev) => (prev != null ? [...prev, assistantMsg] : null))
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

  const {
    submitQuestion,
    stopQuestion,
    loading: chatLoading,
    error: chatError,
  } =
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

  const {
    executeRound: executeFocusGroupRound,
    loading: focusGroupLoading,
    activeParticipantIndex: focusGroupHookActiveIndex,
    clearError: clearFocusGroupHookError,
  } = useFocusGroupRound({
    orgId,
    userId: user?.id ?? "",
    projectId: id,
    projectStatus: project?.status ?? "live",
    orgSettings: {
      weighted: orgSettings.weighted,
      data_source_mode: orgSettings.data_source_mode,
    },
  })

  useEffect(() => {
    setFocusGroupActiveParticipantIndex(focusGroupHookActiveIndex)
  }, [focusGroupHookActiveIndex])
  useEffect(() => {
    setFocusGroupRunning(focusGroupLoading)
  }, [focusGroupLoading])

  // Forward-reference to `handleFocusGroupFollowUp`: declared further down so
  // we expose it via a ref to let `sendChatMessage` route follow-up rounds
  // without taking on a use-before-define dependency.
  const focusGroupFollowUpRef = useRef<
    ((topic: string) => Promise<void>) | null
  >(null)

  const isResponseLoading = useRealChat ? chatLoading : false
  const controlsLocked = isResponseLoading
  const navigationBlockMessage =
    "smartARSE is still generating a response. Please wait before leaving this page."

  const notifyNavigationBlocked = useCallback(() => {
    toast.error(navigationBlockMessage)
  }, [])

  useEffect(() => {
    if (chatError) toast.error(chatError)
  }, [chatError])

  useEffect(() => {
    if (!isResponseLoading || typeof window === "undefined") return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    const handleDocumentClickCapture = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest("a[href]")
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return
      }
      if (anchor.target === "_blank") return

      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#")) return

      const nextUrl = new URL(anchor.href, window.location.href)
      const currentUrl = new URL(window.location.href)
      const stayingOnPage =
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search &&
        nextUrl.hash === currentUrl.hash

      if (stayingOnPage) return

      event.preventDefault()
      event.stopPropagation()
      notifyNavigationBlocked()
    }

    const handlePopState = () => {
      notifyNavigationBlocked()
      window.history.pushState({ smartArseNavGuard: true }, "", window.location.href)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("click", handleDocumentClickCapture, true)
    window.addEventListener("popstate", handlePopState)
    window.history.pushState({ smartArseNavGuard: true }, "", window.location.href)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("click", handleDocumentClickCapture, true)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [isResponseLoading, notifyNavigationBlocked])

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
      cite_color_token:
        f.citeColorToken && f.citeColorToken.trim()
          ? f.citeColorToken.trim()
          : null,
      source_icon_key:
        f.sourceIconKey && f.sourceIconKey.trim()
          ? f.sourceIconKey.trim()
          : null,
    }))
  }, [readyDocuments])
  const [timelineEvents, setTimelineEvents] = useState<ChatTimelineItem[]>([])
  const [appliedPersonaId, setAppliedPersonaId] = useState<string | null>(null)
  const [appliedCustomAudience, setAppliedCustomAudience] =
    useState<SavedCustomAudience | null>(null)
  const [focusGroupSession, setFocusGroupSession] =
    useState<FocusGroupSession | null>(null)
  const [focusGroupRounds, setFocusGroupRounds] = useState<FocusGroupRound[]>(
    []
  )
  const [focusGroupActiveParticipantIndex, setFocusGroupActiveParticipantIndex] =
    useState<number | null>(null)
  const [focusGroupRunning, setFocusGroupRunning] = useState(false)
  /**
   * In-flight round used by the transcript renderer: shows participants as
   * they stream in (one bubble at a time + "X is thinking…" indicator on the
   * next speaker). Cleared once the full round is appended to
   * `focusGroupRounds`.
   */
  const [liveFocusGroupRound, setLiveFocusGroupRound] = useState<{
    roundNumber: number
    topic: string
    responses: FocusGroupResponse[]
    activeParticipantIndex: number | null
  } | null>(null)
  const [mobilePersonasOpen, setMobilePersonasOpen] = useState(false)
  const [desktopPersonasCollapsed, setDesktopPersonasCollapsed] =
    useState(false)

  const handleOpenPersonasControls = useCallback(() => {
    if (controlsLocked) return
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches &&
      desktopPersonasCollapsed
    ) {
      setDesktopPersonasCollapsed(false)
      return
    }
    setMobilePersonasOpen(true)
  }, [controlsLocked, desktopPersonasCollapsed])

  useEffect(() => {
    if (!desktopPersonasCollapsed) setMobilePersonasOpen(false)
  }, [desktopPersonasCollapsed])

  const appliedPersona = useMemo(
    () =>
      appliedPersonaId
        ? (segmentPersonas.find((p) => p.id === appliedPersonaId) ?? null)
        : null,
    [appliedPersonaId, segmentPersonas]
  )
  const personaLocked = appliedPersonaId !== null
  const customAudienceLocked = appliedCustomAudience !== null
  const focusGroupLocked = focusGroupSession !== null
  const activeChatContextMode = appliedCustomAudience
    ? "custom_audience"
    : appliedPersona
      ? "persona_segment"
      : "default"
  const personasById = useMemo(
    () =>
      segmentPersonas.reduce<Record<string, (typeof segmentPersonas)[number]>>(
        (acc, p) => {
          acc[p.id] = p
          return acc
        },
        {}
      ),
    [segmentPersonas]
  )
  const studyLabelForWebhook = useMemo(
    () => project?.name?.trim() || null,
    [project?.name]
  )
  const focusGroupHistoricalView =
    focusGroupSession != null && focusGroupSession.endedAt != null
  const chatInputDisabled =
    (useRealChat &&
      (chatLoading ||
        historyLoadingRequestId != null ||
        (project ? !isProjectLiveForChat(project.status) : true))) ||
    (appliedCustomAudience != null &&
      isArchivedCustomAudienceId(appliedCustomAudience.id)) ||
    focusGroupLoading ||
    focusGroupHistoricalView

  const chatInputDisabledTooltip =
    appliedCustomAudience != null && isArchivedCustomAudienceId(appliedCustomAudience.id)
      ? "This audience is no longer in your saved list, so new messages cannot be sent in this thread. Create a new custom audience to continue chatting."
      : focusGroupHistoricalView
        ? "This focus group has ended. Close it from the right rail and start a new one to ask questions."
        : undefined

  const sendChatMessage = useCallback(
    (rawContent: string, options?: { webhookChatInput?: string }) => {
      const content = rawContent.trim()
      if (!content || chatInputDisabled) return

      // While a focus group is active, the chat input becomes the next
      // round's topic; route through the focus-group flow instead of normal
      // chat persistence. Use the ref so we don't depend on a function that
      // is declared later in the component body.
      if (focusGroupSession) {
        void focusGroupFollowUpRef.current?.(content)
        return
      }

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
        let personaBrief: string | undefined
        let personaBriefConcern: number | undefined
        if (appliedPersona) {
          const built = buildWebhookBriefForSegmentPersona(appliedPersona, {
            studyLabel: studyLabelForWebhook,
          })
          personaBrief = built.brief
          personaBriefConcern = built.concern
        } else if (appliedCustomAudience) {
          const built = buildWebhookBriefForCustomAudience(
            appliedCustomAudience,
            { studyLabel: studyLabelForWebhook }
          )
          personaBrief = built.brief
          personaBriefConcern = built.concern
        }

        const prior = messages.filter(
          (m) => m.role === "user" || m.role === "assistant"
        )
        const chatHistoryForWebhook = [...prior, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }))
        setMessages((prev) => [...prev, userMsg])
        setOrderedTimelineItems((prev) => (prev != null ? [...prev, userMsg] : null))
        void submitQuestion(content, {
          threadAnchorRequestId: activeThreadRequestId,
          chatHistoryForWebhook: activeThreadRequestId
            ? chatHistoryForWebhook
            : undefined,
          projectDocumentsForWebhook,
          personaSegment: appliedPersona
            ? {
                id: appliedPersona.id,
                name: appliedPersona.title,
                colorToken:
                  personaSegmentColorTokenForId(appliedPersona.id, segmentPersonas) ?? null,
              }
            : {
                id: null,
                name: null,
                colorToken: null,
              },
          customAudience: appliedCustomAudience
            ? {
                id: appliedCustomAudience.id,
                name: appliedCustomAudience.name,
                childSegmentIds: appliedCustomAudience.snapshot.childSegments.map(
                  (segment) => segment.id
                ),
                childSegmentNames: appliedCustomAudience.snapshot.childSegments.map(
                  (segment) => segment.name
                ),
                childSegmentColorTokens:
                  appliedCustomAudience.childSegmentColorTokens,
              }
            : undefined,
          chatContextMode: activeChatContextMode,
          webhookChatInput: options?.webhookChatInput,
          ...(personaBrief !== undefined &&
          personaBriefConcern !== undefined
            ? { personaBrief, personaBriefConcern }
            : {}),
          ...(appliedCustomAudience &&
          isDraftCustomAudienceId(appliedCustomAudience.id) &&
          activeChatContextMode === "custom_audience"
            ? { showInChatHistory: false }
            : {}),
        })
        return
      }

      setMessages((prev) => [...prev, userMsg])
      appendMockAssistantAndHistory(content)
    },
    [
      appliedPersona,
      appliedCustomAudience,
      activeChatContextMode,
      studyLabelForWebhook,
      activeThreadRequestId,
      appendMockAssistantAndHistory,
      chatInputDisabled,
      focusGroupSession,
      id,
      messages,
      projectDocumentsForWebhook,
      sourceDocumentIds,
      submitQuestion,
      useRealChat,
      segmentPersonas,
    ]
  )

  const promoteDraftExploreThread = useCallback(
    async (saved: SavedCustomAudience) => {
      const anchorId = activeThreadRequestId
      if (!anchorId) return
      try {
        const res = await fetch("/api/chat/promote-draft-custom-audience-thread", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: id,
            anchor_request_id: anchorId,
            saved_audience_id: saved.id,
          }),
        })
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        if (!res.ok) {
          toast.error(
            body?.error?.trim() || "Could not link chat to saved audience."
          )
          return
        }
        refreshHistory()
      } catch {
        toast.error("Could not link chat to saved audience.")
      }
    },
    [activeThreadRequestId, id, refreshHistory]
  )

  const makeCustomAudienceActivationEvent = useCallback(
    (
      audience: SavedCustomAudience,
      timestamp?: string,
      stableEventId?: string
    ): ChatTimelineItem => ({
      id: stableEventId ?? `custom-audience-${Date.now()}`,
      type: "custom_audience_activated",
      timestamp: timestamp ?? new Date().toISOString(),
      customAudienceName: audience.name,
      childSegmentNames: audience.snapshot.childSegments.map((segment) => segment.name),
      baseSize: audience.baseSize,
      avgConcern: audience.avgConcern,
    }),
    []
  )

  const handleSuggestedQuestionSelect = useCallback(
    (question: string) => {
      sendChatMessage(question)
    },
    [sendChatMessage]
  )

  function handleApplyPersona(personaId: string) {
    setAppliedCustomAudience(null)
    setAppliedPersonaId(personaId)
    setActiveThreadRequestId(null)
    setMessages([])
    setOrderedTimelineItems(null)
    setSessionId(crypto.randomUUID())
    setMobilePersonasOpen(false)
    setTimelineEvents([
      {
        id: `persona-${Date.now()}`,
        type: "persona_activated",
        timestamp: new Date().toISOString(),
        personaId,
      },
    ])
  }

  function handleClearPersona() {
    if (!appliedPersonaId) return
    setActiveThreadRequestId(null)
    setMessages([])
    setOrderedTimelineItems(null)
    setTimelineEvents([])
    setAppliedPersonaId(null)
  }

  function handleApplyCustomAudience(audience: SavedCustomAudience) {
    setAppliedPersonaId(null)
    setAppliedCustomAudience(audience)
    setActiveThreadRequestId(null)
    setMessages([])
    setOrderedTimelineItems(null)
    setSessionId(crypto.randomUUID())
    setTimelineEvents([makeCustomAudienceActivationEvent(audience)])
    setMobilePersonasOpen(false)
  }

  function handleReplaceAppliedCustomAudience(audience: SavedCustomAudience) {
    const prev = appliedCustomAudience
    setAppliedCustomAudience(audience)
    if (prev && isDraftCustomAudienceId(prev.id) && activeThreadRequestId) {
      void promoteDraftExploreThread(audience)
    }
  }

  function handleClearCustomAudience() {
    setAppliedCustomAudience(null)
    setActiveThreadRequestId(null)
    setMessages([])
    setOrderedTimelineItems(null)
    setSessionId(crypto.randomUUID())
    setTimelineEvents([])
  }

  const runFocusGroupRound = useCallback(
    async (
      session: FocusGroupSession,
      topic: string,
      roundNumber: number,
      priorRounds: readonly FocusGroupRound[]
    ): Promise<FocusGroupRound | null> => {
      clearFocusGroupHookError()
      setLiveFocusGroupRound({
        roundNumber,
        topic: topic.trim(),
        responses: [],
        activeParticipantIndex: null,
      })
      try {
        const round = await executeFocusGroupRound({
          session,
          personasById,
          topic,
          roundNumber,
          priorRounds,
          studyLabel: studyLabelForWebhook,
          onParticipantStart: (index) => {
            setLiveFocusGroupRound((prev) =>
              prev && prev.roundNumber === roundNumber
                ? { ...prev, activeParticipantIndex: index }
                : prev
            )
          },
          onParticipantResponse: (response) => {
            setLiveFocusGroupRound((prev) =>
              prev && prev.roundNumber === roundNumber
                ? {
                    ...prev,
                    responses: [...prev.responses, response],
                    activeParticipantIndex:
                      response.participantIndex + 1 < session.participants.length
                        ? response.participantIndex + 1
                        : null,
                  }
                : prev
            )
          },
        })
        setFocusGroupRounds((prev) => [...prev, round])
        setFocusGroupSession((prev) =>
          prev
            ? { ...prev, roundCount: prev.roundCount + 1, rounds: [...prev.rounds, round] }
            : prev
        )
        refreshHistory()
        return round
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Focus group round failed."
        toast.error(message)
        return null
      } finally {
        setLiveFocusGroupRound(null)
      }
    },
    [
      clearFocusGroupHookError,
      executeFocusGroupRound,
      personasById,
      refreshHistory,
      studyLabelForWebhook,
    ]
  )

  const handleStartFocusGroup = useCallback(
    async (
      personaIds: readonly string[],
      countryContext: FocusGroupCountryContext,
      topic: string
    ): Promise<void> => {
      if (focusGroupLocked || personaLocked || customAudienceLocked) return
      const trimmedTopic = topic.trim()
      if (!trimmedTopic) return
      const selected = personaIds
        .map((pid) => personasById[pid])
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
      if (selected.length < 2 || selected.length > 4) {
        toast.error("Choose between 2 and 4 segments to start a focus group.")
        return
      }

      const participants = selected.map((persona) =>
        participantFromPersona(persona)
      )

      let createdSession: FocusGroupSession
      try {
        const res = await fetch("/api/focus-group/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: id,
            participants: selected.map((persona) => ({
              persona_id: persona.id,
              segment_code: persona.segmentCode,
              title: persona.title,
              color_token: persona.colorCiteToken,
            })),
            country_context: countryContext,
            initial_topic: trimmedTopic,
          }),
        })
        const payload = (await res.json().catch(() => ({}))) as
          | { session: { id: string; project_id: string; organization_id: string; created_by: string | null; participants: unknown; country_context: FocusGroupCountryContext; initial_topic: string; round_count: number; created_at: string; ended_at: string | null } }
          | { error?: string }
        if (!res.ok || !("session" in payload)) {
          const message =
            "error" in payload && payload.error
              ? payload.error
              : "Failed to start focus group."
          toast.error(message)
          return
        }
        createdSession = {
          id: payload.session.id,
          projectId: payload.session.project_id,
          organizationId: payload.session.organization_id,
          createdBy: payload.session.created_by,
          participants,
          countryContext: payload.session.country_context,
          initialTopic: payload.session.initial_topic,
          roundCount: payload.session.round_count,
          rounds: [],
          createdAt: payload.session.created_at,
          endedAt: payload.session.ended_at,
        }
      } catch {
        toast.error("Failed to start focus group.")
        return
      }

      setAppliedPersonaId(null)
      setAppliedCustomAudience(null)
      setActiveThreadRequestId(null)
      setMessages([])
      setOrderedTimelineItems(null)
      setSessionId(crypto.randomUUID())
      setTimelineEvents([])
      setFocusGroupRounds([])
      setFocusGroupSession(createdSession)
      setMobilePersonasOpen(false)

      await runFocusGroupRound(createdSession, trimmedTopic, 1, [])
    },
    [
      focusGroupLocked,
      personaLocked,
      customAudienceLocked,
      personasById,
      id,
      runFocusGroupRound,
    ]
  )

  const handleFocusGroupFollowUp = useCallback(
    async (topic: string): Promise<void> => {
      if (!focusGroupSession) return
      const trimmedTopic = topic.trim()
      if (!trimmedTopic) return
      const nextRoundNumber = focusGroupRounds.length + 1
      await runFocusGroupRound(
        focusGroupSession,
        trimmedTopic,
        nextRoundNumber,
        focusGroupRounds
      )
    },
    [focusGroupSession, focusGroupRounds, runFocusGroupRound]
  )

  useEffect(() => {
    focusGroupFollowUpRef.current = handleFocusGroupFollowUp
  }, [handleFocusGroupFollowUp])

  const handleEndFocusGroup = useCallback(async (): Promise<void> => {
    const current = focusGroupSession
    if (!current) return
    // Only call the end endpoint for sessions that are still active.
    // A historical (already-ended) session being closed just clears local UI.
    if (current.endedAt == null) {
      try {
        await fetch(`/api/focus-group/sessions/${current.id}/end`, {
          method: "POST",
        })
      } catch {
        /* non-blocking */
      }
    }
    setFocusGroupSession(null)
    setFocusGroupRounds([])
    setLiveFocusGroupRound(null)
    setActiveThreadRequestId(null)
    setMessages([])
    setOrderedTimelineItems(null)
    setSessionId(crypto.randomUUID())
    setTimelineEvents([])
    refreshHistory()
  }, [focusGroupSession, refreshHistory])

  const loadThreadByRequestId = useCallback(
    async (requestId: string) => {
      setHistoryLoadingRequestId(requestId)
      try {
        const row = await getChatResult(requestId, id)
        const hydration = chatHydrationFromStoredResult({
          user_query: row.user_query,
          created_at: row.created_at,
          result_payload: row.result_payload,
          conversationId: `conv-${id}`,
        })
        const loaded = hydration.messages
        const restoredPersonaId = row.persona_segment_id
        const knownPersona =
          restoredPersonaId && isCanonicalSegmentId(restoredPersonaId)
            ? restoredPersonaId
            : null
        const restoredCustomAudience = ghostCustomAudienceFromChatRow(
          {
            request_id: row.request_id,
            chat_context_mode: row.chat_context_mode ?? null,
            custom_audience_id: row.custom_audience_id,
            custom_audience_name: row.custom_audience_name,
            custom_audience_child_segment_ids: row.custom_audience_child_segment_ids,
            custom_audience_child_segment_names: row.custom_audience_child_segment_names,
            custom_audience_child_segment_color_tokens:
              row.custom_audience_child_segment_color_tokens,
          },
          id,
          row.created_at
        )
        if (row.chat_context_mode === "custom_audience") {
          setAppliedPersonaId(null)
          setAppliedCustomAudience(restoredCustomAudience)
        } else if (row.chat_context_mode === "persona_segment") {
          setAppliedPersonaId(knownPersona)
          setAppliedCustomAudience(null)
        } else {
          setAppliedPersonaId(knownPersona)
          setAppliedCustomAudience(knownPersona ? null : restoredCustomAudience)
        }

        let ordered: ChatTimelineItem[] | null = hydration.orderedTimelineItems
        if (ordered && !hydration.hasStoredContextActivation) {
          const firstUserTs =
            ordered.find(
              (item): item is ChatMessage =>
                "role" in item && item.role === "user"
            )?.timestamp ?? row.created_at
          const before = isoOneMsBefore(firstUserTs)
          if (row.chat_context_mode === "custom_audience" && restoredCustomAudience) {
            ordered = [
              makeCustomAudienceActivationEvent(
                restoredCustomAudience,
                before,
                `legacy-custom-act-${row.request_id}`
              ),
              ...ordered,
            ]
          } else if (
            knownPersona &&
            (row.chat_context_mode === "persona_segment" ||
              row.chat_context_mode === "default")
          ) {
            ordered = [
              {
                id: `legacy-persona-act-${row.request_id}`,
                type: "persona_activated",
                timestamp: before,
                personaId: knownPersona,
              },
              ...ordered,
            ]
          } else if (
            restoredCustomAudience &&
            row.chat_context_mode === "default" &&
            !knownPersona
          ) {
            ordered = [
              makeCustomAudienceActivationEvent(
                restoredCustomAudience,
                before,
                `legacy-custom-act-${row.request_id}`
              ),
              ...ordered,
            ]
          }
        }

        if (ordered) {
          setOrderedTimelineItems(ordered)
          setTimelineEvents([])
        } else {
          setOrderedTimelineItems(null)
          if (row.chat_context_mode === "custom_audience") {
            setTimelineEvents(
              restoredCustomAudience
                ? [makeCustomAudienceActivationEvent(restoredCustomAudience, row.created_at)]
                : []
            )
          } else if (row.chat_context_mode === "persona_segment") {
            setTimelineEvents(
              knownPersona
                ? [
                    {
                      id: `persona-${Date.now()}`,
                      type: "persona_activated",
                      timestamp: row.created_at,
                      personaId: knownPersona,
                    },
                  ]
                : []
            )
          } else {
            if (knownPersona) {
              setTimelineEvents([
                {
                  id: `persona-${Date.now()}`,
                  type: "persona_activated",
                  timestamp: row.created_at,
                  personaId: knownPersona,
                },
              ])
            } else if (restoredCustomAudience) {
              setTimelineEvents([
                makeCustomAudienceActivationEvent(restoredCustomAudience, row.created_at),
              ])
            } else {
              setTimelineEvents([])
            }
          }
        }

        setMessages(
          loaded.map((m) => ({
            ...m,
            documentIds: m.role === "user" ? sourceDocumentIds : undefined,
          }))
        )
        setFocusGroupSession(null)
        setFocusGroupRounds([])
        setLiveFocusGroupRound(null)
        setActiveThreadRequestId(row.request_id)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load conversation"
        )
      } finally {
        setHistoryLoadingRequestId(null)
      }
    },
    [id, makeCustomAudienceActivationEvent, sourceDocumentIds]
  )

  const restoreFocusGroupFromHistory = useCallback(
    async (sessionId: string) => {
      setHistoryLoadingRequestId(sessionId)
      try {
        const res = await fetch(
          `/api/focus-group/sessions/${encodeURIComponent(sessionId)}`
        )
        const payload = (await res.json().catch(() => null)) as
          | {
              session: {
                id: string
                project_id: string
                organization_id: string
                created_by: string | null
                country_context: FocusGroupCountryContext
                initial_topic: string
                round_count: number
                created_at: string
                ended_at: string | null
              }
              participants: Array<{
                persona_id: string
                segment_code: string
                title: string
                color_token: string
                country?: string | null
              }>
              rounds: Array<{
                round_number: number
                topic: string
                round_request_id: string
                created_at: string
                responses: Array<{
                  participant_index: number
                  participant_label: string
                  participant_color_token: string
                  request_id: string
                  content: string
                  timestamp: string
                  is_placeholder: boolean
                }>
              }>
            }
          | { error?: string }
          | null
        if (!res.ok || !payload || !("session" in payload)) {
          const message =
            payload && "error" in payload && payload.error
              ? payload.error
              : "Failed to load focus group session."
          toast.error(message)
          return
        }

        const participants: FocusGroupSession["participants"] =
          payload.participants.map((p) => ({
            personaId: p.persona_id,
            segmentCode: p.segment_code,
            label: p.title,
            colorToken: p.color_token,
            country: (p.country as FocusGroupCountryContext | null) ?? null,
          }))

        const rounds: FocusGroupRound[] = payload.rounds.map((round) => ({
          roundNumber: round.round_number,
          topic: round.topic,
          roundRequestId: round.round_request_id,
          createdAt: round.created_at,
          responses: round.responses
            .slice()
            .sort((a, b) => a.participant_index - b.participant_index)
            .map<FocusGroupResponse>((r) => ({
              participantIndex: r.participant_index,
              participantLabel: r.participant_label,
              participantColorToken: r.participant_color_token,
              requestId: r.request_id,
              content: r.content,
              timestamp: r.timestamp,
              ...(r.is_placeholder ? { isPlaceholder: true } : {}),
            })),
        }))

        const restored: FocusGroupSession = {
          id: payload.session.id,
          projectId: payload.session.project_id,
          organizationId: payload.session.organization_id,
          createdBy: payload.session.created_by,
          participants,
          countryContext: payload.session.country_context,
          initialTopic: payload.session.initial_topic,
          roundCount: payload.session.round_count,
          rounds,
          createdAt: payload.session.created_at,
          endedAt: payload.session.ended_at,
        }

        setAppliedPersonaId(null)
        setAppliedCustomAudience(null)
        setMessages([])
        setOrderedTimelineItems(null)
        setTimelineEvents([])
        setLiveFocusGroupRound(null)
        setFocusGroupRounds(rounds)
        setFocusGroupSession(restored)
        setActiveThreadRequestId(restored.id)
        setMobilePersonasOpen(false)
      } catch {
        toast.error("Failed to load focus group session.")
      } finally {
        setHistoryLoadingRequestId(null)
      }
    },
    []
  )

  const handleHistoryItemSelect = useCallback(
    async (item: HistoryItem) => {
      if (item.chat_context_mode === "focus_group") {
        const sessionId = item.focus_group_session_id ?? item.request_id
        await restoreFocusGroupFromHistory(sessionId)
        return
      }

      if (useRealChat) {
        await loadThreadByRequestId(item.request_id)
        return
      }

      const ts = new Date().toISOString()
      setOrderedTimelineItems(null)
      setActiveThreadRequestId(null)
      setFocusGroupSession(null)
      setFocusGroupRounds([])
      setLiveFocusGroupRound(null)
      const personaId = item.persona_segment_id ?? null
      setAppliedPersonaId(personaId)

      const demoGhost = ghostCustomAudienceFromChatRow(
        {
          request_id: item.request_id,
          chat_context_mode: null,
          custom_audience_id: item.custom_audience_id ?? null,
          custom_audience_name: item.custom_audience_name ?? null,
          custom_audience_child_segment_ids: item.custom_audience_child_segment_ids ?? null,
          custom_audience_child_segment_names: item.custom_audience_child_segment_names ?? null,
          custom_audience_child_segment_color_tokens:
            item.custom_audience_child_segment_color_tokens ?? null,
        },
        id,
        ts
      )

      if (personaId) {
        setAppliedCustomAudience(null)
      } else {
        setAppliedCustomAudience(demoGhost)
      }

      if (personaId) {
        setTimelineEvents([
          {
            id: `persona-${Date.now()}`,
            type: "persona_activated",
            timestamp: ts,
            personaId,
          },
        ])
      } else if (demoGhost) {
        setTimelineEvents([makeCustomAudienceActivationEvent(demoGhost, ts)])
      } else {
        setTimelineEvents([])
      }
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
      setActiveThreadRequestId(item.request_id)
    },
    [id, makeCustomAudienceActivationEvent, sourceDocumentIds, useRealChat, loadThreadByRequestId, restoreFocusGroupFromHistory]
  )

  const handleNewChat = useCallback(() => {
    if (isResponseLoading) return
    if (focusGroupRunning) return
    setActiveThreadRequestId(null)
    setMessages([])
    setOrderedTimelineItems(null)
    setTimelineEvents([])
    setAppliedPersonaId(null)
    setAppliedCustomAudience(null)
    setFocusGroupSession(null)
    setFocusGroupRounds([])
    setLiveFocusGroupRound(null)
  }, [isResponseLoading, focusGroupRunning])

  const handleStopResponse = useCallback(() => {
    if (!isResponseLoading) return
    const cancelled: ChatMessage = {
      id: `msg-${crypto.randomUUID()}`,
      conversationId: `conv-${id}`,
      role: "assistant",
      content: "Cancelled.",
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, cancelled])
    setOrderedTimelineItems((prev) => (prev != null ? [...prev, cancelled] : null))
    void stopQuestion()
  }, [id, isResponseLoading, stopQuestion])

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
    <div className="flex h-full min-h-0 w-full flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1"
      >
        <Link
          href="/client/projects"
          aria-disabled={isResponseLoading}
          className={cn(
            "shrink-0 font-arse-body text-sm font-medium text-arse-black/70",
            isResponseLoading
              ? "cursor-not-allowed opacity-60"
              : "hover:text-arse-pink"
          )}
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
          "mt-6 grid grid-cols-1 items-start gap-6 lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)] lg:items-stretch lg:gap-8",
          desktopPersonasCollapsed
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]"
            : "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]"
        )}
      >
          <aside className="min-w-0 space-y-6 lg:self-start">
            <button
              type="button"
              onClick={handleNewChat}
              disabled={isResponseLoading}
              aria-disabled={isResponseLoading}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-arse-black bg-white px-4 py-2.5 font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black shadow-[3px_3px_0_0_var(--arse-pink)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink",
                isResponseLoading
                  ? "cursor-not-allowed opacity-60"
                  : "hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_var(--arse-pink)]"
              )}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
              New chat
            </button>
            <ChatHistoryCard
              items={chatHistoryItems}
              pagination={chatHistoryPagination}
              page={chatHistoryPage}
              loading={showHistoryLoading}
              resolvedSegmentPersonas={segmentPersonas}
              savedCustomAudiences={useRemoteDetail ? savedAudiencesForHistory : null}
              onFetchPage={(p) => {
                if (useRemoteDetail) {
                  void fetchApiHistoryPage(p)
                  return
                }
                setMockHistoryUIPage((prev) => {
                  const next = Math.min(Math.max(1, p), mockHistoryTotalPages)
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
                    <span className="flex flex-col items-center gap-1">
                      <span className="font-bold">
                        Access until{" "}
                        {format(
                          parseISO(`${project.accessUntil}T12:00:00`),
                          "MMM d, yyyy"
                        )}
                      </span>
                      <span className="h-px w-full max-w-[18rem] bg-border/80" />
                      <span>Talk to your Disrupt team to extend access</span>
                    </span>
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
            className="order-first min-h-0 min-w-0 lg:order-none lg:h-full"
            onPointerDownCapture={handleWorkspacePointerDownCapture}
          >
            <ProjectChat
              messages={messages}
              timelineEvents={timelineEvents}
              orderedTimelineItems={orderedTimelineItems}
              citationDocuments={readyDocuments}
              userName={user?.name}
              isLoading={useRealChat ? chatLoading : false}
              controlsDisabled={controlsLocked}
              appliedPersonaId={appliedPersonaId}
              appliedCustomAudience={appliedCustomAudience}
              focusGroupSession={focusGroupSession}
              focusGroupRounds={focusGroupRounds}
              liveFocusGroupRound={liveFocusGroupRound}
              focusGroupRunning={focusGroupRunning}
              segmentPersonas={segmentPersonas}
              disabled={
                chatInputDisabled
              }
              disabledInputTooltip={chatInputDisabledTooltip}
              personasColumnCollapsed={desktopPersonasCollapsed}
              onOpenPersonas={handleOpenPersonasControls}
              onStop={handleStopResponse}
              onSend={sendChatMessage}
            />
          </div>

          {!desktopPersonasCollapsed ? (
            <div
              className="hidden min-h-0 min-w-0 lg:block lg:self-start"
              onPointerDownCapture={handleWorkspacePointerDownCapture}
            >
              <ProjectRightSidebar
                appliedPersona={appliedPersona}
                appliedCustomAudience={appliedCustomAudience}
                appliedFocusGroup={focusGroupSession}
                projectId={id}
                onApplyPersona={handleApplyPersona}
                onApplyCustomAudience={handleApplyCustomAudience}
                onReplaceAppliedCustomAudience={handleReplaceAppliedCustomAudience}
                onPromoteDraftExploreThread={promoteDraftExploreThread}
                onClearPersona={handleClearPersona}
                onClearCustomAudience={handleClearCustomAudience}
                onStartFocusGroup={handleStartFocusGroup}
                onEndFocusGroup={handleEndFocusGroup}
                focusGroupRunning={focusGroupRunning}
                onSuggestedQuestionSelect={handleSuggestedQuestionSelect}
                personaLocked={personaLocked || customAudienceLocked || focusGroupLocked}
                onCollapseColumn={() => setDesktopPersonasCollapsed(true)}
                disabled={controlsLocked}
                segmentPersonas={segmentPersonas}
                onSavedAudiencesHydrated={handleSavedAudiencesHydrated}
                onSavedAudienceUpsert={handleSavedAudienceUpsert}
                onSavedAudienceDeleted={handleSavedAudienceDeleted}
              />
            </div>
          ) : null}
        </div>

        <MobilePersonaDrawer
          open={mobilePersonasOpen}
          onOpenChange={setMobilePersonasOpen}
          appliedPersona={appliedPersona}
          appliedCustomAudience={appliedCustomAudience}
          appliedFocusGroup={focusGroupSession}
          projectId={id}
          onApply={handleApplyPersona}
          onApplyCustomAudience={handleApplyCustomAudience}
          onReplaceAppliedCustomAudience={handleReplaceAppliedCustomAudience}
          onPromoteDraftExploreThread={promoteDraftExploreThread}
          onClearPersona={handleClearPersona}
          onClearCustomAudience={handleClearCustomAudience}
          onStartFocusGroup={handleStartFocusGroup}
          onEndFocusGroup={handleEndFocusGroup}
          focusGroupRunning={focusGroupRunning}
          onSuggestedQuestionSelect={handleSuggestedQuestionSelect}
          personaLocked={personaLocked || customAudienceLocked || focusGroupLocked}
          disabled={controlsLocked}
          segmentPersonas={segmentPersonas}
          onSavedAudiencesHydrated={handleSavedAudiencesHydrated}
          onSavedAudienceUpsert={handleSavedAudienceUpsert}
          onSavedAudienceDeleted={handleSavedAudienceDeleted}
          onSidebarPointerDownCapture={
            workspaceChatBlocked ? handleWorkspacePointerDownCapture : undefined
          }
        />
    </div>
  )
}
