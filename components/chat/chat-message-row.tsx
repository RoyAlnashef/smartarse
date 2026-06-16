"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Smaller on mobile; standard size from sm+. */
export const CHAT_AVATAR_SIZE_CLASS = "h-6 w-6 sm:h-8 sm:w-8"

export const CHAT_AVATAR_TEXT_CLASS = "text-[8px] sm:text-[10px]"

export function ChatMessageRow({
  role,
  avatar,
  children,
  className,
}: {
  role: "assistant" | "user"
  avatar: ReactNode
  children: ReactNode
  className?: string
}) {
  const isUser = role === "user"

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3",
        isUser ? "items-end sm:justify-end" : "items-start sm:justify-start",
        className
      )}
    >
      <div className={cn("shrink-0", isUser && "sm:order-2")}>{avatar}</div>
      <div className={cn("w-full min-w-0", isUser && "sm:order-1")}>{children}</div>
    </div>
  )
}
