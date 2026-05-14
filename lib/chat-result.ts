import type { ChatResultRow } from "@/lib/chat-result-types"

export async function getChatResult(
  requestId: string,
  projectId: string
): Promise<ChatResultRow> {
  const params = new URLSearchParams({
    request_id: requestId,
    project_id: projectId,
  })
  const res = await fetch(`/api/chat/result?${params.toString()}`)

  if (res.status === 401) {
    throw new Error("Not authenticated")
  }
  if (res.status === 404) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error?.trim() || "Chat result not found")
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error?.trim() || "Failed to load chat result")
  }

  return res.json() as Promise<ChatResultRow>
}
