"use client"

import {
  useState,
  useCallback,
  useMemo,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  type FormEvent,
} from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import {
  ArrowLeft,
  ArrowUpDown,
  MessageSquare,
  FileText,
  Save,
  Upload,
  Users,
  Settings,
  UserCircle,
  CalendarIcon,
  Info,
  Plus,
  Minus,
  X,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ProjectDetailSkeleton } from "@/components/dashboard/project-detail-skeleton"
import {
  projects as mockProjects,
  uploadedFiles,
  uploadedPersonas,
  users as mockUsers,
  conversations as mockConversations,
} from "@/lib/mock-data"
import { chatMessagesFromStoredResult } from "@/lib/chat-thread"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  deleteProjectDocument,
  listProjectDocuments,
  reorderProjectDocuments,
  updateProjectDocumentCiteColor,
  updateProjectDocumentDisplayName,
  updateProjectDocumentSourceIcon,
} from "@/lib/supabase/documents"
import {
  deleteProjectPersona,
  listProjectPersonas,
  reorderProjectPersonas,
  updateProjectPersonaCanonicalSegment,
  updateProjectPersonaDisplayName,
  updateProjectPersonaSegmentColor,
  updateProjectPersonaSegmentDescription,
} from "@/lib/supabase/personas"
import {
  projectStatusBadgeClassName,
  projectStatusLabel,
  utcCalendarDateString,
} from "@/lib/project-status"
import {
  addProjectCredits,
  deleteProject,
  fetchProjectCreditSpendByUser,
  getProjectById,
  removeProjectCredits,
  updateProject,
} from "@/lib/supabase/projects"
import { listUsersForDashboard } from "@/lib/supabase/users"
import { ChatWindow } from "@/components/chat/chat-window"
import { ChatInput } from "@/components/chat/chat-input"
import {
  ChatSidebar,
  type ChatSidebarConversationMeta,
} from "@/components/chat/chat-sidebar"
import { FileDropzone } from "@/components/upload/file-dropzone"
import { FileList } from "@/components/upload/file-list"
import {
  SortableProjectDocumentsTable,
  isPersistedProjectDocumentRow,
} from "@/components/upload/sortable-project-documents-table"
import { SortableProjectPersonasTable } from "@/components/upload/sortable-project-personas-table"
import { useMockProjectDocuments } from "@/components/upload/use-mock-project-documents"
import { useMockProjectPersonas } from "@/components/upload/use-mock-project-personas"
import { useSupabaseProjectUploadFlow } from "@/components/upload/use-supabase-project-upload-flow"
import { useSupabaseProjectPersonasUploadFlow } from "@/components/upload/use-supabase-project-personas-upload-flow"
import {
  PERSONA_FILE_UPLOAD_ACCEPT,
  PERSONA_FILE_UPLOAD_TYPES_DESCRIPTION,
} from "@/components/upload/persona-upload-config"
import {
  CREDIT_BALANCE_WARNING_THRESHOLD,
  ProjectCreditsMeter,
} from "@/components/dashboard/project-credits-meter"
import { ProjectUsers } from "@/components/projects/project-users"
import { DemoProjectSetting } from "@/components/dashboard/demo-project-setting"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DASHBOARD_MAIN_ACCENT_CLASS } from "@/lib/constants"
import type {
  AdminChatHistoryItem,
  AdminChatHistoryResponse,
} from "@/lib/admin-chat-history-types"
import { getAdminProjectChatHistory } from "@/lib/admin-project-chat-history"
import { getAdminProjectChatResult } from "@/lib/admin-project-chat-result"
import {
  getAdminProjectFocusGroupSession,
  type AdminFocusGroupSessionPayload,
} from "@/lib/admin-project-focus-group-session"
import type { CitationDocumentRef } from "@/lib/documents/display-label"
import { resolveSegmentPersonasFromFiles } from "@/lib/personas/segment-display"
import type {
  ChatMessage,
  Conversation,
  Project,
  SavedCustomAudience,
  UploadedFile,
  User,
} from "@/lib/types"
import { cn } from "@/lib/utils"

const tabs = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "uploads", label: "Documents", icon: FileText, adminOnly: true },
  { id: "personas", label: "Personas", icon: UserCircle, adminOnly: true },
  { id: "members", label: "Members", icon: Users, adminOnly: true },
  { id: "settings", label: "Settings", icon: Settings },
] as const

type TabId = (typeof tabs)[number]["id"]

type SettingsSectionId = "info" | "credits" | "delete"

// Simulated AI responses for demo
const demoResponses = [
  "Based on the selected documents, I found several relevant data points. The research indicates a significant shift in consumer preferences over the past 12 months, with a 23% increase in digital-first purchasing behaviour across all age demographics.",
  "Cross-referencing the available data sources, the key findings suggest that market penetration in the target segment has grown by 15.7% year-over-year. The strongest growth is concentrated in the 25-34 age bracket.",
  "The analysis reveals three primary trends: (1) increased price sensitivity among premium consumers, (2) growing demand for sustainable alternatives, and (3) a notable shift toward subscription-based models in this category.",
]

const UNSAVED_DOCUMENT_ORDER_LEAVE_MESSAGE =
  "You haven't saved your document order yet. Leave this page anyway?"

const UNSAVED_PERSONA_ORDER_LEAVE_MESSAGE =
  "You haven't saved your persona order yet. Leave this page anyway?"

function sumCreditSpendByUserMap(m: ReadonlyMap<string, number>): number {
  let t = 0
  for (const v of m.values()) t += v
  return t
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const mockProject = useMemo(
    () => mockProjects.find((p) => p.id === id) ?? null,
    [id]
  )

  const useRemoteDetail = !!getSupabaseBrowserClient() && !!user
  const [remoteProject, setRemoteProject] = useState<Project | null | undefined>(
    undefined
  )
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([])
  const [memberCreditSpendByUserId, setMemberCreditSpendByUserId] = useState(
    () => new Map<string, number>()
  )

  useEffect(() => {
    if (!user) {
      setRemoteProject(undefined)
      setDirectoryUsers([])
      setMemberCreditSpendByUserId(new Map())
      return
    }
    if (!getSupabaseBrowserClient()) {
      setRemoteProject(undefined)
      setDirectoryUsers(mockUsers)
      setMemberCreditSpendByUserId(new Map())
      return
    }

    let cancelled = false
    setRemoteProject(undefined)

    const usersPromise =
      user.role === "admin"
        ? listUsersForDashboard()
        : Promise.resolve([] as User[])

    const creditSpendPromise =
      user.role === "admin"
        ? fetchProjectCreditSpendByUser(id)
        : Promise.resolve(new Map<string, number>())

    Promise.all([getProjectById(id), usersPromise, creditSpendPromise])
      .then(([proj, dir, creditSpend]) => {
        if (!cancelled) {
          setRemoteProject(proj)
          setDirectoryUsers(dir)
          setMemberCreditSpendByUserId(creditSpend)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "Failed to load project"
          )
          setRemoteProject(null)
          setDirectoryUsers([])
          setMemberCreditSpendByUserId(new Map())
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

  const memberDirectoryUsers = useRemoteDetail ? directoryUsers : mockUsers

  const refreshProjectFromServer = useCallback(async () => {
    if (!getSupabaseBrowserClient() || !user) return
    try {
      const [proj, creditSpend] = await Promise.all([
        getProjectById(id),
        user.role === "admin"
          ? fetchProjectCreditSpendByUser(id)
          : Promise.resolve(new Map<string, number>()),
      ])
      setRemoteProject(proj)
      if (user.role === "admin") {
        setMemberCreditSpendByUserId(creditSpend)
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to refresh project"
      )
    }
  }, [id, user?.id, user?.role])

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

  const [remotePersonas, setRemotePersonas] = useState<
    UploadedFile[] | undefined
  >(undefined)

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
      .catch((err: unknown) => {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "Failed to load personas"
          )
          setRemotePersonas([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, user?.id, useRemoteDetail])

  const {
    mergedDocuments: remoteMergedDocuments,
    uploadFiles: runRemoteUploads,
    dismissPendingUpload,
    pendingCount: remoteUploadPendingCount,
  } = useSupabaseProjectUploadFlow({
    projectId: id,
    remoteDocuments,
    setRemoteDocuments,
  })

  const {
    mergedPersonas: remoteMergedPersonas,
    uploadFiles: runRemotePersonaUploads,
    dismissPendingUpload: dismissPendingPersonaUpload,
    pendingCount: remotePersonaUploadPendingCount,
  } = useSupabaseProjectPersonasUploadFlow({
    projectId: id,
    remotePersonas,
    setRemotePersonas,
  })

  const { localFiles, addFiles, removeFile, localIds } = useMockProjectDocuments({
    projectId: id,
    uploadedBy: user?.id ?? "unknown",
  })

  const {
    localFiles: localPersonaFiles,
    addFiles: addPersonaFiles,
    removeFile: removePersonaFile,
    localIds: localPersonaIds,
  } = useMockProjectPersonas({
    projectId: id,
    uploadedBy: user?.id ?? "unknown",
  })

  const mergedProjectFiles = useMemo(() => {
    if (useRemoteDetail) {
      return remoteMergedDocuments
    }
    const seed = uploadedFiles
      .filter((f) => f.projectId === id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    return [...localFiles, ...seed]
  }, [useRemoteDetail, remoteMergedDocuments, id, localFiles])

  const mergedProjectPersonas = useMemo(() => {
    if (useRemoteDetail) {
      return remoteMergedPersonas
    }
    const seed = uploadedPersonas
      .filter((f) => f.projectId === id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    return [...localPersonaFiles, ...seed]
  }, [useRemoteDetail, remoteMergedPersonas, id, localPersonaFiles])

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

  /** Document cite colors and persona segment colors share the same palette; reserve both. */
  const reservedCiteAndSegmentColorTokens = useMemo(() => {
    const fromDocs = mergedProjectFiles
      .map((file) => file.citeColorToken?.trim() ?? "")
      .filter((token) => token !== "")
    const fromPersonas = mergedProjectPersonas
      .map((file) => file.segmentColorToken?.trim() ?? "")
      .filter((token) => token !== "")
    return [...fromDocs, ...fromPersonas]
  }, [mergedProjectFiles, mergedProjectPersonas])

  const projectConversations = mockConversations.filter((c) => c.projectId === id)

  const [activeTab, setActiveTab] = useState<TabId>("chat")
  const [settingsSection, setSettingsSection] = useState<SettingsSectionId>("info")
  const projectTabScrollRef = useRef<HTMLDivElement>(null)
  const creditsAmountInputRef = useRef<HTMLInputElement>(null)
  const focusCreditsAmountAfterMeterClick = useRef(false)

  useEffect(() => {
    const root = projectTabScrollRef.current
    if (!root) return
    const trigger = root.querySelector<HTMLElement>(`[data-project-tab="${activeTab}"]`)
    trigger?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: "smooth",
    })
  }, [activeTab])

  useLayoutEffect(() => {
    if (activeTab !== "settings" || settingsSection !== "credits") return
    if (!focusCreditsAmountAfterMeterClick.current) return
    focusCreditsAmountAfterMeterClick.current = false
    creditsAmountInputRef.current?.focus()
  }, [activeTab, settingsSection])

  const [conversations, setConversations] = useState<Conversation[]>(projectConversations)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    projectConversations[0]?.id ?? null
  )
  const [isTyping, setIsTyping] = useState(false)
  const [isDeletingProject, setIsDeletingProject] = useState(false)
  const [creditAmountInput, setCreditAmountInput] = useState("")
  const [creditsBusy, setCreditsBusy] = useState<false | "add" | "remove">(false)
  const [settingsName, setSettingsName] = useState("")
  const [settingsDescription, setSettingsDescription] = useState("")
  const [settingsStatus, setSettingsStatus] = useState<Project["status"]>("live")
  const [settingsAccessUntil, setSettingsAccessUntil] = useState<string | null>(
    null
  )
  const [settingsDisplayDate, setSettingsDisplayDate] = useState<string | null>(
    null
  )
  const [settingsCardSubline, setSettingsCardSubline] = useState("")
  const [accessUntilPickerOpen, setAccessUntilPickerOpen] = useState(false)
  const [displayDatePickerOpen, setDisplayDatePickerOpen] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [documentOrderUnlocked, setDocumentOrderUnlocked] = useState(false)
  const [draftStableDocumentIds, setDraftStableDocumentIds] = useState<string[]>(
    []
  )
  const [isSavingDocumentOrder, setIsSavingDocumentOrder] = useState(false)
  const [uploadDocsModalOpen, setUploadDocsModalOpen] = useState(false)
  const [personaOrderUnlocked, setPersonaOrderUnlocked] = useState(false)
  const [draftStablePersonaIds, setDraftStablePersonaIds] = useState<string[]>(
    []
  )
  const [isSavingPersonaOrder, setIsSavingPersonaOrder] = useState(false)
  const [uploadPersonasModalOpen, setUploadPersonasModalOpen] = useState(false)
  const isChatReadOnly = user?.role === "admin"
  const useAdminProjectHistory = Boolean(useRemoteDetail && user?.role === "admin")
  const [adminHistory, setAdminHistory] = useState<AdminChatHistoryItem[]>([])
  const [adminHistoryPagination, setAdminHistoryPagination] = useState<
    AdminChatHistoryResponse["pagination"] | null
  >(null)
  const [adminNextHistoryPage, setAdminNextHistoryPage] = useState(1)
  const [adminHasMoreHistory, setAdminHasMoreHistory] = useState(false)
  const [adminHistoryLoading, setAdminHistoryLoading] = useState(false)
  const [adminHistoryLoadingMore, setAdminHistoryLoadingMore] = useState(false)
  const [adminInitialHistoryLoaded, setAdminInitialHistoryLoaded] = useState(false)
  const [adminHistoryError, setAdminHistoryError] = useState<string | null>(null)
  const [adminResultLoadingId, setAdminResultLoadingId] = useState<string | null>(null)
  const [adminActiveRequestId, setAdminActiveRequestId] = useState<string | null>(null)
  const [adminMessages, setAdminMessages] = useState<ChatMessage[]>([])
  const [adminFocusGroupSession, setAdminFocusGroupSession] =
    useState<AdminFocusGroupSessionPayload | null>(null)

  useEffect(() => {
    setDocumentOrderUnlocked(false)
    setDraftStableDocumentIds([])
    setUploadDocsModalOpen(false)
    setPersonaOrderUnlocked(false)
    setDraftStablePersonaIds([])
    setUploadPersonasModalOpen(false)
  }, [id])

  useEffect(() => {
    if (!documentOrderUnlocked || !remoteDocuments) return
    const orderedRemoteIds = remoteDocuments.map((f) => f.id)
    setDraftStableDocumentIds((prev) => {
      const kept = prev.filter((docId) => orderedRemoteIds.includes(docId))
      const extras = orderedRemoteIds.filter((docId) => !kept.includes(docId))
      return [...kept, ...extras]
    })
  }, [remoteDocuments, documentOrderUnlocked])

  useEffect(() => {
    if (!personaOrderUnlocked || !remotePersonas) return
    const orderedRemoteIds = remotePersonas.map((f) => f.id)
    setDraftStablePersonaIds((prev) => {
      const kept = prev.filter((personaId) => orderedRemoteIds.includes(personaId))
      const extras = orderedRemoteIds.filter(
        (personaId) => !kept.includes(personaId)
      )
      return [...kept, ...extras]
    })
  }, [remotePersonas, personaOrderUnlocked])

  const persistedDocumentCount = useMemo(
    () => mergedProjectFiles.filter(isPersistedProjectDocumentRow).length,
    [mergedProjectFiles]
  )

  const persistedPersonaCount = useMemo(
    () => mergedProjectPersonas.filter(isPersistedProjectDocumentRow).length,
    [mergedProjectPersonas]
  )

  useEffect(() => {
    setAdminNextHistoryPage(1)
    setAdminHasMoreHistory(false)
    setAdminHistory([])
    setAdminHistoryPagination(null)
    setAdminHistoryError(null)
    setAdminInitialHistoryLoaded(false)
    setAdminMessages([])
    setAdminFocusGroupSession(null)
    setAdminActiveRequestId(null)
    setAdminResultLoadingId(null)
  }, [id])

  const loadAdminHistoryPage = useCallback(
    async (page: number, append = false) => {
      if (!useAdminProjectHistory) return
      if (append) {
        setAdminHistoryLoadingMore(true)
      } else {
        setAdminHistoryLoading(true)
        setAdminInitialHistoryLoaded(false)
        setAdminHistoryError(null)
      }
      try {
        const data = await getAdminProjectChatHistory({
          projectId: id,
          page,
          userId: null,
        })
        setAdminHistory((prev) => {
          if (!append) return data.history
          const existing = new Set(prev.map((item) => item.request_id))
          const nextRows = data.history.filter((item) => !existing.has(item.request_id))
          return [...prev, ...nextRows]
        })
        setAdminHistoryPagination(data.pagination)
        setAdminHasMoreHistory(data.pagination.page < data.pagination.totalPages)
        setAdminNextHistoryPage(data.pagination.page + 1)
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load project chat history"
        setAdminHistoryError(message)
        if (!append) {
          setAdminHistory([])
        }
      } finally {
        if (append) {
          setAdminHistoryLoadingMore(false)
        } else {
          setAdminHistoryLoading(false)
          setAdminInitialHistoryLoaded(true)
        }
      }
    },
    [id, useAdminProjectHistory]
  )

  useEffect(() => {
    if (!useAdminProjectHistory) return
    void loadAdminHistoryPage(1, false)
  }, [useAdminProjectHistory, loadAdminHistoryPage])

  const handleAdminHistorySelect = useCallback(
    async (requestId: string) => {
      if (!useAdminProjectHistory) return
      setAdminResultLoadingId(requestId)
      try {
        const item = adminHistory.find((row) => row.request_id === requestId)
        if (item?.chat_context_mode === "focus_group" && item.focus_group_session_id) {
          const payload = await getAdminProjectFocusGroupSession(
            id,
            item.focus_group_session_id
          )
          setAdminMessages([])
          setAdminFocusGroupSession(payload)
          setAdminActiveRequestId(requestId)
          return
        }
        const row = await getAdminProjectChatResult(id, requestId)
        const loaded = chatMessagesFromStoredResult({
          user_query: row.user_query,
          created_at: row.created_at,
          result_payload: row.result_payload,
          conversationId: `project-admin-${id}`,
        })
        setAdminFocusGroupSession(null)
        setAdminMessages(loaded)
        setAdminActiveRequestId(requestId)
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load selected conversation"
        )
      } finally {
        setAdminResultLoadingId(null)
      }
    },
    [id, useAdminProjectHistory, adminHistory]
  )

  const handleAdminReloadHistory = useCallback(() => {
    if (!useAdminProjectHistory) return
    if (adminHistoryLoading || adminResultLoadingId) return
    // Reset the admin chat-history state to the same shape as initial mount so
    // the auto-select effect re-runs against the freshly fetched list. This
    // makes the reload button behave like a page reload scoped to the chats.
    setAdminNextHistoryPage(1)
    setAdminHasMoreHistory(false)
    setAdminHistoryPagination(null)
    setAdminHistoryError(null)
    setAdminMessages([])
    setAdminFocusGroupSession(null)
    setAdminActiveRequestId(null)
    setAdminResultLoadingId(null)
    void loadAdminHistoryPage(1, false)
  }, [
    useAdminProjectHistory,
    adminHistoryLoading,
    adminResultLoadingId,
    loadAdminHistoryPage,
  ])

  useEffect(() => {
    if (!useAdminProjectHistory) return
    if (adminHistoryLoading || adminResultLoadingId) return
    if (adminActiveRequestId) return
    const latest = adminHistory[0]
    if (!latest) return
    void handleAdminHistorySelect(latest.request_id)
  }, [
    useAdminProjectHistory,
    adminHistoryLoading,
    adminResultLoadingId,
    adminActiveRequestId,
    adminHistory,
    handleAdminHistorySelect,
  ])

  const handleUnlockDocumentOrder = useCallback(() => {
    const stable = mergedProjectFiles.filter(isPersistedProjectDocumentRow)
    setDraftStableDocumentIds(stable.map((f) => f.id))
    setDocumentOrderUnlocked(true)
  }, [mergedProjectFiles])

  const handleLockDocumentOrder = useCallback(async () => {
    if (!useRemoteDetail) return
    setIsSavingDocumentOrder(true)
    try {
      await reorderProjectDocuments(id, draftStableDocumentIds)
      const list = await listProjectDocuments(id)
      setRemoteDocuments(list)
      setDocumentOrderUnlocked(false)
      setDraftStableDocumentIds([])
      toast.success("Document order saved")
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Could not save document order"
      )
    } finally {
      setIsSavingDocumentOrder(false)
    }
  }, [useRemoteDetail, id, draftStableDocumentIds])

  const handleCancelDocumentOrder = useCallback(() => {
    setDocumentOrderUnlocked(false)
    setDraftStableDocumentIds([])
  }, [])

  const handleUnlockPersonaOrder = useCallback(() => {
    const stable = mergedProjectPersonas.filter(isPersistedProjectDocumentRow)
    setDraftStablePersonaIds(stable.map((f) => f.id))
    setPersonaOrderUnlocked(true)
  }, [mergedProjectPersonas])

  const handleLockPersonaOrder = useCallback(async () => {
    if (!useRemoteDetail) return
    setIsSavingPersonaOrder(true)
    try {
      await reorderProjectPersonas(id, draftStablePersonaIds)
      const list = await listProjectPersonas(id)
      setRemotePersonas(list)
      setPersonaOrderUnlocked(false)
      setDraftStablePersonaIds([])
      toast.success("Persona order saved")
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Could not save persona order"
      )
    } finally {
      setIsSavingPersonaOrder(false)
    }
  }, [useRemoteDetail, id, draftStablePersonaIds])

  const handleCancelPersonaOrder = useCallback(() => {
    setPersonaOrderUnlocked(false)
    setDraftStablePersonaIds([])
  }, [])

  const confirmLeaveIfUnsavedOrder = useCallback((): boolean => {
    if (documentOrderUnlocked && useRemoteDetail) {
      if (!window.confirm(UNSAVED_DOCUMENT_ORDER_LEAVE_MESSAGE)) return false
    }
    if (personaOrderUnlocked && useRemoteDetail) {
      if (!window.confirm(UNSAVED_PERSONA_ORDER_LEAVE_MESSAGE)) return false
    }
    return true
  }, [documentOrderUnlocked, personaOrderUnlocked, useRemoteDetail])

  const handleBackToProjects = useCallback(() => {
    if (!confirmLeaveIfUnsavedOrder()) return
    router.push("/projects")
  }, [confirmLeaveIfUnsavedOrder, router])

  useEffect(() => {
    const shouldWarn =
      useRemoteDetail && (documentOrderUnlocked || personaOrderUnlocked)
    if (!shouldWarn) return

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [documentOrderUnlocked, personaOrderUnlocked, useRemoteDetail])

  /**
   * Next.js `<Link>` calls `router.push` from a click handler; the Navigation API’s
   * `preventDefault` does not stop that. Intercept same-origin `<a href>` clicks in the
   * capture phase so Cancel on `confirm` keeps the user on this project page.
   */
  useEffect(() => {
    const shouldWarn =
      useRemoteDetail && (documentOrderUnlocked || personaOrderUnlocked)
    if (!shouldWarn) return

    const projectPath = `/projects/${id}`
    const normalizePath = (p: string) => {
      const t = p.replace(/\/$/, "") || "/"
      return t
    }
    const here = normalizePath(projectPath)

    const onClickCapture = (e: MouseEvent) => {
      if (e.defaultPrevented) return
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }
      const el = e.target
      if (!(el instanceof Element)) return
      const a = el.closest("a[href]")
      if (!a || !(a instanceof HTMLAnchorElement)) return
      if (a.hasAttribute("download")) return
      const href = a.getAttribute("href")
      if (!href || href.startsWith("#")) return

      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      if (url.protocol !== "http:" && url.protocol !== "https:") return
      if (url.origin !== window.location.origin) return
      if (normalizePath(url.pathname) === here) return

      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      if (confirmLeaveIfUnsavedOrder()) {
        router.push(`${url.pathname}${url.search}${url.hash}`)
      }
    }

    document.addEventListener("click", onClickCapture, true)
    return () => document.removeEventListener("click", onClickCapture, true)
  }, [
    documentOrderUnlocked,
    personaOrderUnlocked,
    useRemoteDetail,
    id,
    router,
    confirmLeaveIfUnsavedOrder,
  ])

  useEffect(() => {
    if (!project) return
    setSettingsName(project.name)
    setSettingsDescription(project.description)
    setSettingsStatus(project.status)
    setSettingsAccessUntil(project.accessUntil ?? null)
    setSettingsDisplayDate(project.displayDate ?? null)
    setSettingsCardSubline(project.cardSubline ?? "")
  }, [
    project?.id,
    project?.name,
    project?.description,
    project?.status,
    project?.accessUntil,
    project?.displayDate,
    project?.cardSubline,
  ])

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  )

  const adminSidebarConversations = useMemo<Conversation[]>(
    () =>
      adminHistory.map((item) => ({
        id: item.request_id,
        projectId: id,
        title: item.user_query,
        createdAt: item.created_at,
        lastMessageAt: item.created_at,
        messageCount: 0,
        messages: [],
      })),
    [adminHistory, id]
  )

  const adminSidebarMeta = useMemo<
    Record<string, ChatSidebarConversationMeta>
  >(() => {
    const out: Record<string, ChatSidebarConversationMeta> = {}
    for (const item of adminHistory) {
      out[item.request_id] = {
        userLabel: item.user_label,
        chatContextMode: item.chat_context_mode ?? null,
        personaSegmentId: item.persona_segment_id ?? null,
        personaSegmentName: item.persona_segment_name ?? null,
        personaSegmentColorToken: item.persona_segment_color_token ?? null,
        customAudienceId: item.custom_audience_id ?? null,
        customAudienceName: item.custom_audience_name ?? null,
        customAudienceChildSegmentIds: item.custom_audience_child_segment_ids ?? null,
        customAudienceChildSegmentColorTokens:
          item.custom_audience_child_segment_color_tokens ?? null,
        focusGroupSessionId: item.focus_group_session_id ?? null,
        focusGroupRoundCount: item.focus_group_round_count ?? null,
        focusGroupParticipantCount: item.focus_group_participant_count ?? null,
        focusGroupParticipantColorTokens:
          item.focus_group_participant_color_tokens ?? null,
      }
    }
    return out
  }, [adminHistory])

  const adminChatWindowLoading =
    useAdminProjectHistory &&
    (!adminInitialHistoryLoaded ||
      adminHistoryLoading ||
      (adminHistory.length > 0 && !adminActiveRequestId))

  const adminChatSidebarLoading =
    useAdminProjectHistory && (!adminInitialHistoryLoaded || adminHistoryLoading)

  useEffect(() => {
    if (!useAdminProjectHistory || !adminActiveRequestId) return
    const stillVisible = adminHistory.some(
      (row) => row.request_id === adminActiveRequestId
    )
    if (!stillVisible) {
      setAdminActiveRequestId(null)
      setAdminMessages([])
      setAdminFocusGroupSession(null)
    }
  }, [useAdminProjectHistory, adminHistory, adminActiveRequestId])

  const readyDocumentIds = useMemo(
    () =>
      mergedProjectFiles
        .filter((f) => f.projectId === id && f.status === "ready")
        .map((f) => f.id),
    [id, mergedProjectFiles]
  )

  const chatCitationDocuments = useMemo((): CitationDocumentRef[] => {
    return mergedProjectFiles.filter(
      (f) => f.projectId === id && f.status === "ready"
    )
  }, [id, mergedProjectFiles])

  const handleAddFiles = useCallback(
    (files: File[]) => {
      if (useRemoteDetail) {
        if (!user) return
        void runRemoteUploads(files)
        return
      }
      addFiles(files)
    },
    [useRemoteDetail, user, runRemoteUploads, addFiles]
  )

  const handleSaveDocumentDisplayName = useCallback(
    async (documentId: string, displayName: string | null) => {
      if (!useRemoteDetail) return
      try {
        const { document: updated, mirrorSync } =
          await updateProjectDocumentDisplayName(documentId, {
            displayName,
          })
        setRemoteDocuments((prev) =>
          (prev ?? []).map((f) => (f.id === documentId ? updated : f))
        )
        toast.success(
          displayName?.trim()
            ? "Display name saved"
            : "Display name cleared — file name will be used"
        )
        if (mirrorSync.status === "skipped_no_match") {
          toast.warning(
            "Display name saved. Offline title sync skipped (no matching record)."
          )
        }
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Could not save display name"
        )
      }
    },
    [useRemoteDetail]
  )

  const handleSaveDocumentCiteColor = useCallback(
    async (documentId: string, citeColorToken: string | null) => {
      if (!useRemoteDetail) return
      try {
        const updated = await updateProjectDocumentCiteColor(documentId, {
          citeColorToken,
        })
        setRemoteDocuments((prev) =>
          (prev ?? []).map((f) => (f.id === documentId ? updated : f))
        )
        toast.success(
          citeColorToken?.trim()
            ? "Source color saved"
            : "Source color reset to default"
        )
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Could not save source color"
        )
      }
    },
    [useRemoteDetail]
  )

  const handleSaveDocumentSourceIcon = useCallback(
    async (documentId: string, sourceIconKey: string | null) => {
      if (!useRemoteDetail) return
      try {
        const updated = await updateProjectDocumentSourceIcon(documentId, {
          sourceIconKey,
        })
        setRemoteDocuments((prev) =>
          (prev ?? []).map((f) => (f.id === documentId ? updated : f))
        )
        toast.success(
          sourceIconKey?.trim()
            ? "Source icon saved"
            : "Source icon reset to default"
        )
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Could not save source icon"
        )
      }
    },
    [useRemoteDetail]
  )

  const handleSavePersonaDisplayName = useCallback(
    async (personaId: string, displayName: string | null) => {
      if (!useRemoteDetail) return
      try {
        const updated = await updateProjectPersonaDisplayName(personaId, {
          displayName,
        })
        setRemotePersonas((prev) =>
          (prev ?? []).map((f) => (f.id === personaId ? updated : f))
        )
        toast.success(
          displayName?.trim()
            ? "Segment display name saved"
            : "Segment display name cleared — mock title will be used"
        )
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Could not save segment display name"
        )
      }
    },
    [useRemoteDetail]
  )

  const handleSavePersonaSegmentColor = useCallback(
    async (personaId: string, segmentColorToken: string | null) => {
      if (!useRemoteDetail) return
      try {
        const updated = await updateProjectPersonaSegmentColor(personaId, {
          segmentColorToken,
        })
        setRemotePersonas((prev) =>
          (prev ?? []).map((f) => (f.id === personaId ? updated : f))
        )
        toast.success(
          segmentColorToken?.trim()
            ? "Segment color saved"
            : "Segment color reset to default"
        )
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Could not save segment color"
        )
      }
    },
    [useRemoteDetail]
  )

  const handleSavePersonaSegmentDescription = useCallback(
    async (personaId: string, segmentDescription: string | null) => {
      if (!useRemoteDetail) return
      try {
        const updated = await updateProjectPersonaSegmentDescription(personaId, {
          segmentDescription,
        })
        setRemotePersonas((prev) =>
          (prev ?? []).map((f) => (f.id === personaId ? updated : f))
        )
        toast.success(
          segmentDescription?.trim()
            ? "Segment description saved"
            : "Segment description cleared — mock copy will be used"
        )
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Could not save segment description"
        )
      }
    },
    [useRemoteDetail]
  )

  const handleSavePersonaCanonicalSegment = useCallback(
    async (personaId: string, canonicalSegmentId: string | null) => {
      if (!useRemoteDetail) return
      try {
        const updated = await updateProjectPersonaCanonicalSegment(personaId, {
          canonicalSegmentId,
        })
        setRemotePersonas((prev) =>
          (prev ?? []).map((f) => (f.id === personaId ? updated : f))
        )
        toast.success(
          canonicalSegmentId
            ? "Study segment assignment saved"
            : "Study segment assignment cleared"
        )
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Could not update segment assignment"
        )
      }
    },
    [useRemoteDetail]
  )

  const handleDocumentDelete = useCallback(
    (fileId: string) => {
      const meta = mergedProjectFiles.find((f) => f.id === fileId)

      if (useRemoteDetail) {
        if (dismissPendingUpload(fileId)) {
          toast.success(
            meta?.name
              ? `Removed “${meta.name}”`
              : "Upload removed"
          )
          return
        }
        void (async () => {
          try {
            await deleteProjectDocument(fileId)
            setRemoteDocuments((prev) => (prev ?? []).filter((f) => f.id !== fileId))
            toast.success(
              meta?.name
                ? `Deleted “${meta.name}”`
                : "Document deleted"
            )
          } catch (err: unknown) {
            toast.error(
              err instanceof Error ? err.message : "Failed to delete document"
            )
          }
        })()
        return
      }
      if (localIds.has(fileId)) {
        removeFile(fileId)
        toast.success(
          meta?.name
            ? `Deleted “${meta.name}”`
            : "Document deleted"
        )
        return
      }
      toast.info("Built-in demo documents can’t be removed from this view.")
    },
    [
      useRemoteDetail,
      dismissPendingUpload,
      localIds,
      removeFile,
      mergedProjectFiles,
    ]
  )

  const handleAddPersonaFiles = useCallback(
    (files: File[]) => {
      if (useRemoteDetail) {
        if (!user) return
        void runRemotePersonaUploads(files)
        return
      }
      addPersonaFiles(files)
    },
    [useRemoteDetail, user, runRemotePersonaUploads, addPersonaFiles]
  )

  const handlePersonaDelete = useCallback(
    (fileId: string) => {
      const meta = mergedProjectPersonas.find((f) => f.id === fileId)

      if (useRemoteDetail) {
        if (dismissPendingPersonaUpload(fileId)) {
          toast.success(
            meta?.name ? `Removed “${meta.name}”` : "Upload removed"
          )
          return
        }
        void (async () => {
          try {
            await deleteProjectPersona(fileId)
            setRemotePersonas((prev) => (prev ?? []).filter((f) => f.id !== fileId))
            toast.success(
              meta?.name ? `Deleted “${meta.name}”` : "Persona deleted"
            )
          } catch (err: unknown) {
            toast.error(
              err instanceof Error ? err.message : "Failed to delete persona"
            )
          }
        })()
        return
      }
      if (localPersonaIds.has(fileId)) {
        removePersonaFile(fileId)
        toast.success(
          meta?.name ? `Deleted “${meta.name}”` : "Persona deleted"
        )
        return
      }
      toast.info("Built-in demo personas can’t be removed from this view.")
    },
    [
      useRemoteDetail,
      dismissPendingPersonaUpload,
      localPersonaIds,
      removePersonaFile,
      mergedProjectPersonas,
    ]
  )

  const handleSendMessage = useCallback(
    (content: string) => {
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        conversationId: activeConversationId ?? "",
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        documentIds: readyDocumentIds,
      }

      // If no active conversation, create one
      if (!activeConversationId) {
        const newConv: Conversation = {
          id: `conv-new-${Date.now()}`,
          projectId: id,
          title: content.slice(0, 50),
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          messageCount: 1,
          messages: [userMsg],
        }
        setConversations((prev) => [newConv, ...prev])
        setActiveConversationId(newConv.id)
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  messages: [...c.messages, userMsg],
                  messageCount: c.messageCount + 1,
                  lastMessageAt: userMsg.timestamp,
                  title: c.messages.length === 0 ? content.slice(0, 50) : c.title,
                }
              : c
          )
        )
      }

      // Simulate AI response
      setIsTyping(true)
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          conversationId: activeConversationId ?? `conv-new-${Date.now()}`,
          role: "assistant",
          content: demoResponses[Math.floor(Math.random() * demoResponses.length)],
          timestamp: new Date().toISOString(),
        }
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId || (prev[0] && c.id === prev[0].id)
              ? {
                  ...c,
                  messages: [...c.messages, aiResponse],
                  messageCount: c.messageCount + 1,
                  lastMessageAt: aiResponse.timestamp,
                }
              : c
          )
        )
        setIsTyping(false)
      }, 1500)
    },
    [activeConversationId, id, readyDocumentIds]
  )

  const handleDeleteProject = useCallback(async () => {
    if (!useRemoteDetail || user?.role !== "admin") return
    if (!project) return
    if (
      !window.confirm(
        `Permanently delete “${project.name}”? This cannot be undone. Uploaded documents will be removed from storage.`
      )
    ) {
      return
    }
    setIsDeletingProject(true)
    try {
      await deleteProject(id)
      toast.success("Project deleted.")
      router.push("/projects")
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Could not delete project."
      )
    } finally {
      setIsDeletingProject(false)
    }
  }, [useRemoteDetail, user?.role, project, id, router])

  const handleSaveProjectSettings = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!useRemoteDetail || user?.role !== "admin" || !project) return
      const name = settingsName.trim()
      if (!name) {
        toast.error("Project name is required.")
        return
      }
      if (
        settingsStatus === "live" &&
        settingsAccessUntil != null &&
        settingsAccessUntil !== "" &&
        settingsAccessUntil < utcCalendarDateString()
      ) {
        toast.error(
          "Access end date is in the past. Choose a future date, clear it, or set status to Paused."
        )
        return
      }
      setIsSavingSettings(true)
      try {
        await updateProject({
          id,
          name,
          description: settingsDescription.trim(),
          status: settingsStatus,
          accessUntil: settingsAccessUntil,
          displayDate: settingsDisplayDate,
          cardSubline: settingsCardSubline,
        })
        toast.success("Project updated.")
        await refreshProjectFromServer()
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Could not save changes."
        )
      } finally {
        setIsSavingSettings(false)
      }
    },
    [
      useRemoteDetail,
      user?.role,
      project,
      id,
      settingsName,
      settingsDescription,
      settingsStatus,
      settingsAccessUntil,
      settingsDisplayDate,
      settingsCardSubline,
      refreshProjectFromServer,
    ]
  )

  const handleAddCredits = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!useRemoteDetail || user?.role !== "admin") return
      const parsed = Number.parseInt(creditAmountInput.trim(), 10)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast.error("Enter an amount of credits to add")
        return
      }
      setCreditsBusy("add")
      try {
        await addProjectCredits(id, parsed)
        toast.success(`Added ${parsed.toLocaleString()} credits.`)
        setCreditAmountInput("")
        await refreshProjectFromServer()
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Could not add credits."
        )
      } finally {
        setCreditsBusy(false)
      }
    },
    [
      useRemoteDetail,
      user?.role,
      creditAmountInput,
      id,
      refreshProjectFromServer,
    ]
  )

  const handleRemoveCredits = useCallback(async () => {
    if (!useRemoteDetail || user?.role !== "admin" || !project) return
    const parsed = Number.parseInt(creditAmountInput.trim(), 10)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Enter an amount of credits to remove")
      return
    }
    if (
      !window.confirm(
        `Remove ${parsed.toLocaleString()} credits from the allocated pool for "${project.name}"?`
      )
    ) {
      return
    }
    setCreditsBusy("remove")
    try {
      await removeProjectCredits(id, parsed)
      toast.success(`Removed ${parsed.toLocaleString()} credits.`)
      setCreditAmountInput("")
      await refreshProjectFromServer()
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Could not remove credits."
      )
    } finally {
      setCreditsBusy(false)
    }
  }, [
    useRemoteDetail,
    user?.role,
    project,
    creditAmountInput,
    id,
    refreshProjectFromServer,
  ])

  const openSettingsCredits = useCallback(() => {
    focusCreditsAmountAfterMeterClick.current = true
    setActiveTab("settings")
    setSettingsSection("credits")
  }, [])

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Sign in to view this project.</p>
      </div>
    )
  }

  if (loadingRemote) {
    return <ProjectDetailSkeleton />
  }

  if (project == null) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-center text-muted-foreground">
          Project not found or you don&apos;t have access.
        </p>
        <button
          type="button"
          onClick={() => router.push("/projects")}
          className="rounded-lg bg-dark-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-800"
        >
          Back to projects
        </button>
      </div>
    )
  }

  const visibleTabs = tabs.filter((t) => {
    const adminOnly = "adminOnly" in t ? t.adminOnly : false
    return !adminOnly || user.role === "admin"
  })

  const displaySpentCredits =
    user.role === "admin" && useRemoteDetail
      ? sumCreditSpendByUserMap(memberCreditSpendByUserId)
      : project.usedCredits

  const headerCreditsMeterOpensSettings =
    user.role === "admin" && useRemoteDetail

  const creditsBalanceLowWarning =
    project.totalCredits < CREDIT_BALANCE_WARNING_THRESHOLD

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Project header */}
      <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackToProjects}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to dashboard</span>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{project.name}</h1>
            <p className="text-xs text-muted-foreground">{project.clientName}</p>
          </div>
          <span
            className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${projectStatusBadgeClassName(project.status)}`}
          >
            {projectStatusLabel(project.status)}
          </span>
        </div>
        <ProjectCreditsMeter
          creditBalance={project.totalCredits}
          usedCredits={displaySpentCredits}
          variant="header"
          className="shrink-0"
          onClick={headerCreditsMeterOpensSettings ? openSettingsCredits : undefined}
        />
      </div>

      {/* Workspace card — tabs + tab content share one white surface */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="min-w-0 w-full shrink-0 border-b border-border">
          <div
            ref={projectTabScrollRef}
            className="overflow-x-auto overflow-y-hidden overscroll-x-contain [-webkit-overflow-scrolling:touch]"
          >
            <div
              className="flex w-max flex-nowrap items-center gap-2 px-4 lg:px-6"
              role="tablist"
              aria-label="Project sections"
            >
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  data-project-tab={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-dark-950 text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeTab === "chat" && (
          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            {/* Conversation history (left) */}
            <div className="hidden min-h-0 w-72 shrink-0 flex-col border-r border-border bg-muted/50 xl:flex">
              <ChatSidebar
                conversations={
                  useAdminProjectHistory ? adminSidebarConversations : conversations
                }
                activeId={
                  useAdminProjectHistory ? adminActiveRequestId : activeConversationId
                }
                onSelect={
                  useAdminProjectHistory
                    ? (requestId) => {
                        if (adminHistoryLoading || adminResultLoadingId) return
                        void handleAdminHistorySelect(requestId)
                      }
                    : setActiveConversationId
                }
                emptyState={isChatReadOnly ? "skeleton" : "default"}
                isLoading={adminChatSidebarLoading}
                metaByConversationId={
                  useAdminProjectHistory ? adminSidebarMeta : undefined
                }
                errorMessage={useAdminProjectHistory ? adminHistoryError : null}
                onReloadHistory={
                  useAdminProjectHistory ? handleAdminReloadHistory : undefined
                }
                reloadDisabled={
                  !useAdminProjectHistory ||
                  adminHistoryLoading ||
                  adminResultLoadingId != null
                }
                resolvedSegmentPersonas={
                  useRemoteDetail ? segmentPersonas : null
                }
                savedCustomAudiences={
                  useRemoteDetail ? savedAudiencesForHistory : null
                }
              />
              {useAdminProjectHistory && adminHistoryPagination && adminHasMoreHistory ? (
                <div className="border-t border-border px-4 py-2">
                  <button
                    type="button"
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40"
                    disabled={adminHistoryLoading || adminHistoryLoadingMore}
                    onClick={() =>
                      void loadAdminHistoryPage(adminNextHistoryPage, true)
                    }
                  >
                    {adminHistoryLoadingMore ? "Loading..." : "More Chats"}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
              <ChatWindow
                messages={
                  useAdminProjectHistory
                    ? adminMessages
                    : (activeConversation?.messages ?? [])
                }
                isTyping={isTyping}
                isLoading={adminChatWindowLoading}
                emptyState={isChatReadOnly ? "skeleton" : "default"}
                citationDocuments={chatCitationDocuments}
                segmentPersonas={segmentPersonas}
                userName={
                  useAdminProjectHistory && adminFocusGroupSession
                    ? (adminHistory.find(
                        (row) => row.request_id === adminActiveRequestId
                      )?.user_label ?? null)
                    : (user?.name ?? null)
                }
                focusGroupSession={
                  useAdminProjectHistory ? adminFocusGroupSession : null
                }
              />
              {!isChatReadOnly && (
                <ChatInput onSend={handleSendMessage} disabled={isTyping} />
              )}
            </div>
          </div>
        )}

        {activeTab === "uploads" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="mx-auto max-w-2xl space-y-8">
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-foreground">
                    Documents
                  </h2>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {useRemoteDetail && persistedDocumentCount > 0 ? (
                      !documentOrderUnlocked ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUnlockDocumentOrder}
                        >
                          <ArrowUpDown className="h-4 w-4" aria-hidden />
                          Sort Rows
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSavingDocumentOrder}
                            onClick={handleCancelDocumentOrder}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-2 border-arse-pink hover:border-arse-pink focus-visible:ring-arse-pink/40"
                            disabled={isSavingDocumentOrder}
                            onClick={() => void handleLockDocumentOrder()}
                          >
                            <Save className="h-4 w-4" aria-hidden />
                            Save Order
                          </Button>
                        </>
                      )
                    ) : null}
                    {!documentOrderUnlocked ? (
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-lg border-0 bg-dark-950 px-4 text-white shadow-none hover:bg-dark-800 hover:text-white focus-visible:ring-dark-950/40"
                        onClick={() => setUploadDocsModalOpen(true)}
                      >
                        <Upload className="h-4 w-4" aria-hidden />
                        Upload
                      </Button>
                    ) : null}
                  </div>
                </div>
                <Dialog
                  open={uploadDocsModalOpen}
                  onOpenChange={setUploadDocsModalOpen}
                >
                  <DialogContent
                    className={cn("max-w-lg", DASHBOARD_MAIN_ACCENT_CLASS)}
                  >
                    <DialogHeader>
                      <DialogTitle>Upload documents</DialogTitle>
                      <DialogDescription>
                        Drag files into the area below or choose files from your
                        device. Upload starts as soon as you add files.
                      </DialogDescription>
                    </DialogHeader>
                    <FileDropzone
                      onUpload={(files) => {
                        handleAddFiles(files)
                        setUploadDocsModalOpen(false)
                      }}
                    />
                  </DialogContent>
                </Dialog>
                <div className="space-y-6">
                  {useRemoteDetail ? (
                    <SortableProjectDocumentsTable
                      files={mergedProjectFiles}
                      onDelete={handleDocumentDelete}
                      onSaveDisplayName={handleSaveDocumentDisplayName}
                      onSaveCiteColor={handleSaveDocumentCiteColor}
                      onSaveSourceIcon={handleSaveDocumentSourceIcon}
                      isInitialLoading={
                        remoteDocuments === undefined &&
                        remoteUploadPendingCount === 0
                      }
                      reorderUnlocked={documentOrderUnlocked}
                      draftStableIds={draftStableDocumentIds}
                      onDraftStableIdsChange={setDraftStableDocumentIds}
                      unavailableColorTokens={reservedCiteAndSegmentColorTokens}
                    />
                  ) : (
                    <FileList
                      files={mergedProjectFiles}
                      onDelete={handleDocumentDelete}
                      isInitialLoading={false}
                    />
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === "personas" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="mx-auto max-w-2xl space-y-8">
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-foreground">
                    Personas
                  </h2>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {useRemoteDetail && persistedPersonaCount > 0 ? (
                      !personaOrderUnlocked ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUnlockPersonaOrder}
                        >
                          <ArrowUpDown className="h-4 w-4" aria-hidden />
                          Sort Rows
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSavingPersonaOrder}
                            onClick={handleCancelPersonaOrder}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-2 border-arse-pink hover:border-arse-pink focus-visible:ring-arse-pink/40"
                            disabled={isSavingPersonaOrder}
                            onClick={() => void handleLockPersonaOrder()}
                          >
                            <Save className="h-4 w-4" aria-hidden />
                            Save Order
                          </Button>
                        </>
                      )
                    ) : null}
                    {!personaOrderUnlocked ? (
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-lg border-0 bg-dark-950 px-4 text-white shadow-none hover:bg-dark-800 hover:text-white focus-visible:ring-dark-950/40"
                        onClick={() => setUploadPersonasModalOpen(true)}
                      >
                        <Upload className="h-4 w-4" aria-hidden />
                        Upload
                      </Button>
                    ) : null}
                  </div>
                </div>
                <Dialog
                  open={uploadPersonasModalOpen}
                  onOpenChange={setUploadPersonasModalOpen}
                >
                  <DialogContent
                    className={cn("max-w-lg", DASHBOARD_MAIN_ACCENT_CLASS)}
                  >
                    <DialogHeader>
                      <DialogTitle>Upload personas</DialogTitle>
                      <DialogDescription>
                        Add markdown persona files (.md). Upload starts as soon
                        as you add files.
                      </DialogDescription>
                    </DialogHeader>
                    <FileDropzone
                      accept={PERSONA_FILE_UPLOAD_ACCEPT}
                      typesDescription={PERSONA_FILE_UPLOAD_TYPES_DESCRIPTION}
                      onUpload={(files) => {
                        handleAddPersonaFiles(files)
                        setUploadPersonasModalOpen(false)
                      }}
                    />
                  </DialogContent>
                </Dialog>
                <div className="space-y-6">
                  {useRemoteDetail ? (
                    <SortableProjectPersonasTable
                      files={mergedProjectPersonas}
                      onDelete={handlePersonaDelete}
                      onSaveDisplayName={handleSavePersonaDisplayName}
                      onSaveSegmentColor={handleSavePersonaSegmentColor}
                      onSaveSegmentDescription={handleSavePersonaSegmentDescription}
                      onSaveCanonicalSegment={handleSavePersonaCanonicalSegment}
                      isInitialLoading={
                        remotePersonas === undefined &&
                        remotePersonaUploadPendingCount === 0
                      }
                      reorderUnlocked={personaOrderUnlocked}
                      draftStableIds={draftStablePersonaIds}
                      onDraftStableIdsChange={setDraftStablePersonaIds}
                      unavailableColorTokens={reservedCiteAndSegmentColorTokens}
                      labels={{
                        emptyMessage: "No personas uploaded for this project yet.",
                        footerHint: "Markdown personas will appear here.",
                      }}
                    />
                  ) : (
                    <FileList
                      files={mergedProjectPersonas}
                      onDelete={handlePersonaDelete}
                      isInitialLoading={false}
                      emptyMessage="No personas uploaded for this project yet."
                    />
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="mx-auto max-w-2xl">
              <ProjectUsers
                project={project}
                allUsers={memberDirectoryUsers}
                creditSpendByUserId={memberCreditSpendByUserId}
                onAssignmentsChange={
                  useRemoteDetail ? refreshProjectFromServer : undefined
                }
              />
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="flex min-h-0 flex-1 flex-col justify-start overflow-y-auto p-4 lg:p-6">
            <Tabs
              value={settingsSection}
              onValueChange={(v) => setSettingsSection(v as SettingsSectionId)}
              orientation="vertical"
              className="mx-auto flex w-full max-w-4xl flex-col items-start gap-6 md:flex-row md:gap-10"
            >
              <TabsList
                variant="vertical"
                aria-label="Project settings sections"
                className="md:sticky md:top-4"
              >
                <TabsTrigger value="info">Project information</TabsTrigger>
                {user.role === "admin" && useRemoteDetail && (
                  <>
                    <TabsTrigger value="credits">Credits</TabsTrigger>
                    <TabsTrigger value="delete">Delete project</TabsTrigger>
                  </>
                )}
              </TabsList>
              <div className="min-h-0 min-w-0 w-full flex-1 self-start md:min-h-80">
                <TabsContent value="info" className="mt-0 outline-none">
                  <section className="space-y-4">
                    <form
                      className="space-y-4 rounded-xl border border-border bg-card p-6"
                      onSubmit={(ev) => void handleSaveProjectSettings(ev)}
                    >
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Project name
                        </label>
                        <input
                          type="text"
                          value={
                            user.role === "admin" && useRemoteDetail
                              ? settingsName
                              : project.name
                          }
                          onChange={(ev) => setSettingsName(ev.target.value)}
                          disabled={user.role !== "admin" || !useRemoteDetail}
                          className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Organization
                        </label>
                        <input
                          type="text"
                          defaultValue={project.clientName}
                          disabled
                          className="mt-1.5 block w-full rounded-lg border border-border bg-muted px-3.5 py-2.5 text-sm text-muted-foreground"
                        />
                      </div>
                      {user.role === "admin" && useRemoteDetail ? (
                        <DemoProjectSetting projectId={project.id} />
                      ) : null}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-foreground">
                            Status
                          </label>
                          <select
                            value={
                              user.role === "admin" && useRemoteDetail
                                ? settingsStatus
                                : project.status
                            }
                            onChange={(ev) =>
                              setSettingsStatus(ev.target.value as Project["status"])
                            }
                            disabled={user.role !== "admin" || !useRemoteDetail}
                            className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                          >
                            <option value="live">Live</option>
                            <option value="paused">Paused</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <label className="text-sm font-medium text-foreground">
                              Access until
                            </label>
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex shrink-0 rounded-full text-muted-foreground outline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink/30"
                                    aria-label="About access until"
                                  >
                                    <Info className="h-4 w-4" strokeWidth={2} aria-hidden />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-xs text-left text-xs leading-snug"
                                >
                                  Optional. Access ends after this calendar day (UTC).
                                  Expired live projects pause automatically.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          {user.role === "admin" && useRemoteDetail ? (
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <Popover
                                  open={accessUntilPickerOpen}
                                  onOpenChange={setAccessUntilPickerOpen}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className={cn(
                                        "h-auto w-full min-w-0 justify-start rounded-lg border-border px-3.5 py-2.5 text-left text-sm font-normal",
                                        !settingsAccessUntil &&
                                          "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                      <span className="truncate">
                                        {settingsAccessUntil
                                          ? format(
                                              parseISO(
                                                `${settingsAccessUntil}T12:00:00`
                                              ),
                                              "PPP"
                                            )
                                          : "No end date"}
                                      </span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
                                      selected={
                                        settingsAccessUntil
                                          ? parseISO(
                                              `${settingsAccessUntil}T12:00:00`
                                            )
                                          : undefined
                                      }
                                      onSelect={(d) => {
                                        setSettingsAccessUntil(
                                          d ? format(d, "yyyy-MM-dd") : null
                                        )
                                        setAccessUntilPickerOpen(false)
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              {settingsAccessUntil ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
                                  aria-label="Clear access end date"
                                  onClick={() => setSettingsAccessUntil(null)}
                                >
                                  <X className="h-4 w-4" strokeWidth={2} />
                                </Button>
                              ) : null}
                            </div>
                          ) : (
                            <p className="mt-1.5 text-sm text-muted-foreground">
                              {project.accessUntil
                                ? format(
                                    parseISO(`${project.accessUntil}T12:00:00`),
                                    "PPP"
                                  )
                                : "No end date"}
                            </p>
                          )}
                        </div>
                      </div>
                      <Separator className="my-6" />
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <label className="text-sm font-medium text-foreground">
                              Display date
                            </label>
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex shrink-0 rounded-full text-muted-foreground outline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink/30"
                                    aria-label="About display date"
                                  >
                                    <Info className="h-4 w-4" strokeWidth={2} aria-hidden />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-xs text-left text-xs leading-snug"
                                >
                                  Shown on the client project card header (DD/MM/YYYY). Leave empty
                                  to use the project creation date.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          {user.role === "admin" && useRemoteDetail ? (
                            <div className="mt-1.5 flex max-w-md items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <Popover
                                  open={displayDatePickerOpen}
                                  onOpenChange={setDisplayDatePickerOpen}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className={cn(
                                        "h-auto w-full min-w-0 justify-start rounded-lg border-border px-3.5 py-2.5 text-left text-sm font-normal",
                                        !settingsDisplayDate && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                      <span className="truncate">
                                        {settingsDisplayDate
                                          ? format(
                                              parseISO(`${settingsDisplayDate}T12:00:00`),
                                              "PPP"
                                            )
                                          : "Use creation date"}
                                      </span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={
                                        settingsDisplayDate
                                          ? parseISO(`${settingsDisplayDate}T12:00:00`)
                                          : undefined
                                      }
                                      onSelect={(d) => {
                                        setSettingsDisplayDate(
                                          d ? format(d, "yyyy-MM-dd") : null
                                        )
                                        setDisplayDatePickerOpen(false)
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              {settingsDisplayDate ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
                                  aria-label="Clear display date"
                                  onClick={() => setSettingsDisplayDate(null)}
                                >
                                  <X className="h-4 w-4" strokeWidth={2} />
                                </Button>
                              ) : null}
                            </div>
                          ) : (
                            <p className="mt-1.5 text-sm text-muted-foreground">
                              {project.displayDate
                                ? format(
                                    parseISO(`${project.displayDate}T12:00:00`),
                                    "PPP"
                                  )
                                : "Uses creation date"}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            value={
                              user.role === "admin" && useRemoteDetail
                                ? settingsDescription
                                : project.description
                            }
                            onChange={(ev) => setSettingsDescription(ev.target.value)}
                            disabled={user.role !== "admin" || !useRemoteDetail}
                            className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground">
                            Card subline
                          </label>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Optional third line on the client project card. Leave empty for the
                            automatic sources summary.
                          </p>
                          <textarea
                            rows={2}
                            value={
                              user.role === "admin" && useRemoteDetail
                                ? settingsCardSubline
                                : project.cardSubline ?? ""
                            }
                            onChange={(ev) => setSettingsCardSubline(ev.target.value)}
                            disabled={user.role !== "admin" || !useRemoteDetail}
                            placeholder="e.g. 4 research files, quant & qual inputs"
                            className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                          />
                        </div>
                      </div>
                      {user.role === "admin" && useRemoteDetail && (
                        <div className="flex justify-end pt-2">
                          <Button
                            type="submit"
                            disabled={isSavingSettings}
                            className="rounded-lg bg-dark-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-dark-800"
                          >
                            {isSavingSettings ? "Saving…" : "Save Changes"}
                          </Button>
                        </div>
                      )}
                    </form>
                  </section>
                </TabsContent>

                {user.role === "admin" && useRemoteDetail && (
                  <>
                    <TabsContent value="credits" className="mt-0 outline-none">
                      <section className="space-y-4">
                        <div
                          className={cn(
                            "flex flex-col gap-6 rounded-xl border p-6",
                            creditsBalanceLowWarning
                              ? "border-amber-200/90 bg-amber-50/40 dark:border-amber-800/60 dark:bg-amber-950/30"
                              : "border-border bg-card"
                          )}
                        >
                          <div
                            className={cn(
                              "space-y-1 rounded-lg border-l-4 px-3.5 py-3 text-sm leading-relaxed",
                              creditsBalanceLowWarning
                                ? "border-l-amber-500 bg-amber-100/50 text-amber-950/95 dark:border-l-amber-400 dark:bg-amber-950/50 dark:text-amber-50/95"
                                : "border-l-arse-cyan bg-arse-cyan/10 text-foreground/90 dark:bg-arse-cyan/15"
                            )}
                          >
                            <p>
                              <b>smartA.R.S.E. is hungry</b><br></br>
                              Add credits below to keep this ARSE well-fed.
                            </p>
                          </div>
                          <div className="border-b border-border pb-6">
                            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                              <div>
                                <dt
                                  className={cn(
                                    "text-xs font-semibold uppercase tracking-wide text-foreground/75",
                                    creditsBalanceLowWarning &&
                                      "text-amber-800/85 dark:text-amber-200/90"
                                  )}
                                >
                                  Available
                                </dt>
                                <dd
                                  className={cn(
                                    "mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground",
                                    creditsBalanceLowWarning &&
                                      "text-amber-950 dark:text-amber-50"
                                  )}
                                >
                                  {project.totalCredits.toLocaleString()}
                                </dd>
                              </div>
                              <div>
                                <dt
                                  className={cn(
                                    "text-xs font-semibold uppercase tracking-wide text-foreground/75",
                                    creditsBalanceLowWarning &&
                                      "text-amber-800/85 dark:text-amber-200/90"
                                  )}
                                >
                                  Spent
                                </dt>
                                <dd
                                  className={cn(
                                    "mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground",
                                    creditsBalanceLowWarning &&
                                      "text-amber-950 dark:text-amber-50"
                                  )}
                                >
                                  {displaySpentCredits.toLocaleString()}
                                </dd>
                              </div>
                            </dl>
                          </div>
                          <form
                            onSubmit={(ev) => void handleAddCredits(ev)}
                            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
                          >
                            <div className="min-w-[12rem] flex-1">
                              <label
                                htmlFor="credit-top-up-amount"
                                className={cn(
                                  "block text-sm font-medium text-foreground",
                                  creditsBalanceLowWarning &&
                                    "text-amber-900 dark:text-amber-100"
                                )}
                              >
                                Enter a number of credits
                              </label>
                              <input
                                ref={creditsAmountInputRef}
                                id="credit-top-up-amount"
                                type="number"
                                min={1}
                                step={1}
                                inputMode="numeric"
                                value={creditAmountInput}
                                onChange={(ev) =>
                                  setCreditAmountInput(ev.target.value)
                                }
                                disabled={creditsBusy !== false}
                                placeholder="e.g. 500"
                                className={cn(
                                  "mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 disabled:opacity-60",
                                  creditsBalanceLowWarning
                                    ? "focus:border-amber-500 focus:ring-amber-500/25"
                                    : "focus:border-arse-cyan focus:ring-arse-pink/30"
                                )}
                              />
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                              <Button
                                type="submit"
                                disabled={creditsBusy !== false}
                                className="rounded-lg bg-dark-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-dark-800"
                              >
                                {creditsBusy === "add" ? (
                                  "Adding…"
                                ) : (
                                  <>
                                    <Plus aria-hidden />
                                    Add
                                  </>
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={creditsBusy !== false}
                                className="rounded-lg border-destructive/40 px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => void handleRemoveCredits()}
                              >
                                {creditsBusy === "remove" ? (
                                  "Removing…"
                                ) : (
                                  <>
                                    <Minus aria-hidden />
                                    Remove
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        </div>
                      </section>
                    </TabsContent>

                    <TabsContent value="delete" className="mt-0 outline-none">
                      <section className="space-y-4 rounded-xl border border-destructive/25 bg-destructive/5 p-6">
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                          {displaySpentCredits > 0
                            ? "No deleting, sorry!"
                            : "Delete project"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {displaySpentCredits > 0
                            ? "Projects that have used credits cannot be deleted."
                            : "Permanently remove this project and its uploaded documents from storage. Users and the organization are not affected."}
                        </p>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={
                              displaySpentCredits > 0 || isDeletingProject
                            }
                            onClick={() => void handleDeleteProject()}
                          >
                            {isDeletingProject ? "Deleting…" : "Delete Project"}
                          </Button>
                        </div>
                      </section>
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
