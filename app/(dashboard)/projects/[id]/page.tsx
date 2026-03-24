"use client"

import { useState, useCallback, useMemo, use } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  Users,
  Settings,
  Coins,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  projects,
  uploadedFiles,
  users,
  conversations as mockConversations,
} from "@/lib/mock-data"
import { ChatWindow } from "@/components/chat/chat-window"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { DocumentSelector } from "@/components/chat/document-selector"
import { FileDropzone } from "@/components/upload/file-dropzone"
import { FileList } from "@/components/upload/file-list"
import { ProjectUsers } from "@/components/projects/project-users"
import { Badge } from "@/components/ui/badge"
import type { ChatMessage, Conversation } from "@/lib/types"

const tabs = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "uploads", label: "Documents", icon: FileText, adminOnly: true },
  { id: "members", label: "Members", icon: Users, adminOnly: true },
  { id: "settings", label: "Settings", icon: Settings },
] as const

type TabId = (typeof tabs)[number]["id"]

// Simulated AI responses for demo
const demoResponses = [
  "Based on the selected documents, I found several relevant data points. The research indicates a significant shift in consumer preferences over the past 12 months, with a 23% increase in digital-first purchasing behaviour across all age demographics.",
  "Cross-referencing the available data sources, the key findings suggest that market penetration in the target segment has grown by 15.7% year-over-year. The strongest growth is concentrated in the 25-34 age bracket.",
  "The analysis reveals three primary trends: (1) increased price sensitivity among premium consumers, (2) growing demand for sustainable alternatives, and (3) a notable shift toward subscription-based models in this category.",
]

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const project = projects.find((p) => p.id === id)
  const projectFiles = uploadedFiles.filter((f) => f.projectId === id)
  const projectConversations = mockConversations.filter((c) => c.projectId === id)

  const [activeTab, setActiveTab] = useState<TabId>("chat")
  const [conversations, setConversations] = useState<Conversation[]>(projectConversations)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    projectConversations[0]?.id ?? null
  )
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(
    new Set(projectFiles.filter((f) => f.status === "ready").map((f) => f.id))
  )
  const [isTyping, setIsTyping] = useState(false)
  const [showConvSidebar, setShowConvSidebar] = useState(true)
  const isChatReadOnly = user?.role === "admin"

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  )

  const toggleDoc = useCallback((id: string) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSendMessage = useCallback(
    (content: string) => {
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        conversationId: activeConversationId ?? "",
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        documentIds: Array.from(selectedDocs),
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
    [activeConversationId, id, selectedDocs]
  )

  if (!project || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  const visibleTabs = tabs.filter((t) => {
    const adminOnly = "adminOnly" in t ? t.adminOnly : false
    return !adminOnly || user.role === "admin"
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Project header */}
      <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/projects")}
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
            className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              project.status === "live"
                ? "bg-mint-100 text-mint-700"
                : "bg-dark-100 text-dark-500"
            }`}
          >
            {project.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="gap-1.5 rounded-lg px-3 py-1.5 text-sm font-normal bg-white"
          >
            <Coins className="h-4 w-4 text-mint-500" />
            <span className="font-medium text-foreground">{project.usedCredits}</span>
            <span className="text-muted-foreground">credits spent</span>
          </Badge>
        </div>
      </div>

      {/* Workspace card — tabs + tab content share one white surface */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-border px-4 lg:px-6">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-dark-950 text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeTab === "chat" && (
          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            {/* Document selector (left) */}
            <div className="hidden w-64 shrink-0 border-r border-border bg-muted/50 lg:block">
              <DocumentSelector
                files={projectFiles}
                selected={selectedDocs}
                onToggle={toggleDoc}
                disabled={isChatReadOnly}
              />
            </div>

            {/* Chat area (center) */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
              <ChatWindow
                messages={activeConversation?.messages ?? []}
                isTyping={isTyping}
                readOnly={isChatReadOnly}
              />
              {!isChatReadOnly && (
                <ChatInput onSend={handleSendMessage} disabled={isTyping} />
              )}
            </div>

            {/* Conversation history (right) */}
            {showConvSidebar && (
              <div className="hidden w-72 shrink-0 border-l border-border bg-muted/50 xl:block">
                <ChatSidebar
                  conversations={conversations}
                  activeId={activeConversationId}
                  onSelect={setActiveConversationId}
                />
              </div>
            )}

            {/* Toggle sidebar button */}
            <button
              type="button"
              onClick={() => setShowConvSidebar((o) => !o)}
              className="absolute right-4 top-3 z-10 hidden rounded-md border border-border bg-background p-1.5 text-muted-foreground shadow-sm transition-colors hover:bg-muted xl:block"
            >
              {showConvSidebar ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </button>
          </div>
        )}

        {activeTab === "uploads" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="mx-auto max-w-2xl space-y-8">
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Documents
                </h2>
                <div className="space-y-6">
                  <FileDropzone onUpload={() => {}} />
                  <FileList files={projectFiles} />
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="mx-auto max-w-2xl">
              <ProjectUsers project={project} allUsers={users} />
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="mx-auto max-w-2xl space-y-8">
            {/* Project Info */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Project Information</h2>
              <div className="space-y-4 rounded-xl border border-border bg-card p-6">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Project Name
                  </label>
                  <input
                    type="text"
                    defaultValue={project.name}
                    className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    defaultValue={project.description}
                    className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Client
                    </label>
                    <input
                      type="text"
                      defaultValue={project.clientName}
                      disabled
                      className="mt-1.5 block w-full rounded-lg border border-border bg-muted px-3.5 py-2.5 text-sm text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Status
                    </label>
                    <select
                      defaultValue={project.status}
                      className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
                    >
                      <option value="live">Live</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Save */}
            <div className="flex justify-end">
              <button className="rounded-lg bg-dark-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-dark-800">
                Save Changes
              </button>
            </div>
          </div>
        </div>
        )}
        </div>
      </div>
    </div>
  )
}
