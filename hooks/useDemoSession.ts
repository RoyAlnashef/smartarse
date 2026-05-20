"use client"

import { useCallback, useEffect, useState } from "react"
import type { DemoSessionInfo } from "@/lib/demo-access/session"

const defaultSession: DemoSessionInfo = {
  isDemoUser: false,
  demoProjectId: null,
}

export function useDemoSession(enabled: boolean) {
  const [session, setSession] = useState<DemoSessionInfo>(defaultSession)
  const [isLoading, setIsLoading] = useState(enabled)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setSession(defaultSession)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/demo/session")
      if (!res.ok) {
        setSession(defaultSession)
        return
      }
      const data = (await res.json()) as DemoSessionInfo
      setSession(data)
    } catch {
      setSession(defaultSession)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { ...session, isLoading, refresh }
}
