"use client"

import { useCallback, useEffect, useState } from "react"
import { getPastQuestions } from "@/lib/chat-history"
import type { HistoryItem, HistoryResponse } from "@/lib/chat-history-types"

export function useChatHistory({
  projectId,
  enabled = true,
}: {
  projectId: string
  enabled?: boolean
}) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [pagination, setPagination] = useState<
    HistoryResponse["pagination"] | null
  >(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPage = useCallback(
    async (targetPage = 1) => {
      if (!enabled || !projectId) {
        setHistory([])
        setPagination(null)
        setPage(1)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await getPastQuestions(targetPage, projectId)
        setHistory(data.history)
        setPagination(data.pagination)
        setPage(targetPage)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load history"
        )
      } finally {
        setLoading(false)
      }
    },
    [projectId, enabled]
  )

  const refresh = useCallback(() => fetchPage(1), [fetchPage])

  useEffect(() => {
    if (!enabled || !projectId) {
      setHistory([])
      setPagination(null)
      setError(null)
      setLoading(false)
      return
    }
    void fetchPage(1)
  }, [fetchPage, enabled, projectId])

  return { history, pagination, page, loading, error, fetch: fetchPage, refresh }
}
