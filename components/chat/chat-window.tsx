"use client"

import { Bot, Loader2, MessageSquare } from "lucide-react"
import Image from "next/image"
import robotAvatar from "@/public/robot-avatar.png"
import type { ChatMessage } from "@/lib/types"
import type { CitationDocumentRef } from "@/lib/documents/display-label"
import type { PersonaMock } from "@/lib/personas/segment-mocks"
import { MessageBubble } from "./message-bubble"
import { AdminFocusGroupTranscriptRound } from "./admin-focus-group-transcript"
import type { AdminFocusGroupSessionPayload } from "@/lib/admin-project-focus-group-session"
import { CHAT_BUBBLE_MAX_WIDTH_CLASS } from "@/components/chat/chat-markdown-prose"
import {
  CHAT_AVATAR_SIZE_CLASS,
  ChatMessageRow,
} from "@/components/chat/chat-message-row"
import { cn } from "@/lib/utils"

function ChatWindowAdminReadOnlyEmpty() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center bg-white p-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center rounded-2xl border border-arse-pink/25 bg-arse-pink-muted text-arse-pink shadow-sm">
        <Bot className="h-12 w-12" strokeWidth={1.5} aria-hidden />
      </div>
      <h3 className="mt-5 max-w-sm text-center text-lg font-semibold text-foreground">
        No client activity <span className="text-arse-pink">yet</span>
      </h3>
      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        You&apos;ll see the conversation here once your client starts asking smartA.R.S.E. questions. Reach out if they
        need help getting started.
      </p>
    </div>
  )
}

function ChatWindowLoadingState() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-3 bg-white p-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-7 w-7 animate-spin text-arse-pink" aria-hidden />
      <p className="text-sm text-muted-foreground">Loading chat…</p>
    </div>
  )
}

export function ChatWindow({
  messages,
  isTyping,
  isLoading = false,
  emptyState = "default",
  citationDocuments,
  segmentPersonas,
  userName,
  focusGroupSession,
}: {
  messages: ChatMessage[]
  isTyping?: boolean
  isLoading?: boolean
  emptyState?: "default" | "skeleton"
  citationDocuments?: CitationDocumentRef[]
  /** Resolved persona list; forwarded into each bubble for `[4]` segment colors. */
  segmentPersonas?: PersonaMock[]
  userName?: string | null
  /**
   * When set, the window renders the full focus-group transcript (rounds +
   * participant bubbles) instead of `messages`. `messages` is ignored.
   */
  focusGroupSession?: AdminFocusGroupSessionPayload | null
}) {
  if (isLoading) {
    return <ChatWindowLoadingState />
  }

  if (focusGroupSession) {
    const { rounds } = focusGroupSession
    if (rounds.length === 0) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center bg-white p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Focus group has no completed rounds yet
          </h3>
        </div>
      )
    }
    return (
      <div className="flex-1 space-y-6 overflow-x-hidden overflow-y-auto bg-white p-4 lg:p-6">
        {rounds.map((round) => (
          <AdminFocusGroupTranscriptRound
            key={round.round_request_id}
            round={round}
            userName={userName}
          />
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    if (emptyState === "skeleton") {
      return <ChatWindowAdminReadOnlyEmpty />
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-white p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Start a conversation</h3>
        <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
          Ask smartA.R.S.E. anything to begin.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 overflow-x-hidden overflow-y-auto bg-white p-4 lg:p-6">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          citationDocuments={citationDocuments}
          segmentPersonas={segmentPersonas}
          userName={userName}
        />
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <ChatMessageRow
          role="assistant"
          avatar={
            <div className={cn("relative shrink-0 overflow-hidden", CHAT_AVATAR_SIZE_CLASS)}>
              <Image
                src={robotAvatar}
                alt="ARSE avatar"
                fill
                sizes="(max-width: 640px) 24px, 32px"
                className="object-cover"
              />
            </div>
          }
        >
          <div
            className={cn(
              CHAT_BUBBLE_MAX_WIDTH_CLASS,
              "rounded-2xl rounded-bl-md bg-background px-4 py-3"
            )}
          >
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-dark-300" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-dark-300" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-dark-300" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </ChatMessageRow>
      )}

    </div>
  )
}
