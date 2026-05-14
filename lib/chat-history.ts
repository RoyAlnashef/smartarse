import type { HistoryResponse } from "@/lib/chat-history-types"

export async function getPastQuestions(
  page = 1,
  projectId?: string | null
): Promise<HistoryResponse> {
  const params = new URLSearchParams({ page: String(page) })
  if (projectId) {
    params.set("project_id", projectId)
  }

  const res = await fetch(`/api/chat/history?${params.toString()}`)

  if (res.status === 401) {
    throw new Error("Not authenticated")
  }
  if (res.status === 400) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    const message = body?.error?.trim()
    throw new Error(message || "No organization assigned")
  }
  if (!res.ok) {
    throw new Error("Failed to fetch history")
  }

  return res.json() as Promise<HistoryResponse>
}
