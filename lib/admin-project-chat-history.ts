import type { AdminChatHistoryResponse } from "@/lib/admin-chat-history-types"

export async function getAdminProjectChatHistory(input: {
  projectId: string
  page?: number
  userId?: string | null
}): Promise<AdminChatHistoryResponse> {
  const params = new URLSearchParams({ page: String(input.page ?? 1) })
  if (input.userId) params.set("user_id", input.userId)
  const res = await fetch(
    `/api/admin/projects/${input.projectId}/chat-history?${params.toString()}`
  )
  if (res.status === 403) throw new Error("Forbidden")
  if (res.status === 404) throw new Error("Project not found")
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error?.trim() || "Failed to load admin chat history")
  }
  return res.json() as Promise<AdminChatHistoryResponse>
}
