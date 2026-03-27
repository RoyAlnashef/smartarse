import type { HistoryItem } from "@/lib/chat-history-types"

export function groupByDate(
  items: HistoryItem[],
): Record<string, HistoryItem[]> {
  const groups: Record<string, HistoryItem[]> = {}
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86_400_000).toDateString()

  for (const item of items) {
    const dateStr = new Date(item.created_at).toDateString()
    const label =
      dateStr === today
        ? "Today"
        : dateStr === yesterday
          ? "Yesterday"
          : new Date(item.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })

    if (!groups[label]) groups[label] = []
    groups[label].push(item)
  }

  return groups
}
