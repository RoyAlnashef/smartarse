"use client"

import {
  citeColorCssValue,
  citeColorDotFillStyle,
  isCiteColorDotFillToken,
} from "@/lib/theme/cite-color-tokens"
import { personaSegmentDotClass } from "@/lib/theme/persona-segment-theme"
import { cn } from "@/lib/utils"
import type {
  AdminFocusGroupRound,
  AdminFocusGroupRoundResponse,
} from "@/lib/admin-project-focus-group-session"

/**
 * Light-themed variant of the client app's focus-group transcript bubbles.
 * Structurally identical to `FocusGroupResponseBubble` /
 * `FocusGroupRoundTopicBubble` / `FocusGroupTranscriptRound` in
 * `components/client/project-detail/project-chat.tsx`, but rendered against
 * the dashboard's white surface + semantic tokens.
 */

function initialsFromName(name?: string | null): string {
  const normalized = name?.trim()
  if (!normalized) return "ME"
  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase()
}

function AdminFocusGroupResponseBubble({
  response,
}: {
  response: AdminFocusGroupRoundResponse
}) {
  const dotFill = citeColorDotFillStyle(response.participant_color_token)
  const colorCss = citeColorCssValue(response.participant_color_token)
  const tinted = colorCss ? `${colorCss}33` : "rgba(20,20,20,0.18)"
  return (
    <div className="flex items-start gap-2.5">
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase text-white",
          !isCiteColorDotFillToken(response.participant_color_token) &&
            personaSegmentDotClass(response.participant_color_token, "bg-dark-950")
        )}
        style={isCiteColorDotFillToken(response.participant_color_token) ? dotFill : undefined}
        aria-hidden
      >
        {response.participant_label.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
          style={colorCss ? { color: colorCss } : undefined}
        >
          {response.participant_label}
        </p>
        <div
          className={cn(
            "mt-1 rounded-2xl rounded-tl-sm border px-3.5 py-2.5 text-sm leading-relaxed text-foreground",
            response.is_placeholder ? "italic text-muted-foreground" : null
          )}
          style={{ borderColor: tinted, backgroundColor: "var(--background)" }}
        >
          {response.content}
        </div>
      </div>
    </div>
  )
}

function AdminFocusGroupRoundTopicBubble({
  roundNumber,
  topic,
  userInitials,
}: {
  roundNumber: number
  topic: string
  userInitials: string
}) {
  return (
    <div
      className="flex gap-3 justify-end"
      aria-label={`Round ${roundNumber} topic`}
    >
      <div className="flex max-w-[min(42rem,90%)] flex-col items-end">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Round {roundNumber}
          </span>
        </div>
        <div
          className={cn(
            "rounded-2xl rounded-br-md bg-dark-950 px-4 py-3 text-sm leading-[1.7] text-white",
            "break-words"
          )}
        >
          {topic}
        </div>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-arse-black bg-transparent text-[10px] font-bold uppercase text-arse-black">
        {userInitials}
      </div>
    </div>
  )
}

export function AdminFocusGroupTranscriptRound({
  round,
  userName,
}: {
  round: AdminFocusGroupRound
  userName?: string | null
}) {
  const userInitials = initialsFromName(userName)
  return (
    <div className="space-y-4">
      <AdminFocusGroupRoundTopicBubble
        roundNumber={round.round_number}
        topic={round.topic}
        userInitials={userInitials}
      />
      {round.responses.map((r, idx) => (
        <AdminFocusGroupResponseBubble
          key={`${round.round_request_id}-${idx}`}
          response={r}
        />
      ))}
    </div>
  )
}
