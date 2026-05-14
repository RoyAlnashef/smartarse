import type { AdminChatResultRow } from "@/lib/admin-chat-history-types"

export async function getAdminProjectChatResult(
  projectId: string,
  requestId: string
): Promise<AdminChatResultRow> {
  const params = new URLSearchParams({ request_id: requestId })
  const res = await fetch(
    `/api/admin/projects/${projectId}/chat-result?${params.toString()}`
  )
  if (res.status === 403) throw new Error("Forbidden")
  if (res.status === 404) throw new Error("Chat result not found")
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error?.trim() || "Failed to load admin chat result")
  }
  return res.json() as Promise<AdminChatResultRow>
}
