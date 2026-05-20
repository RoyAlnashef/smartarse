"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export function DemoRequestsDemoProjectBanner() {
  const [hasDemoProject, setHasDemoProject] = useState<boolean | null>(null)

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setHasDemoProject(true)
      return
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      setHasDemoProject(true)
      return
    }

    try {
      const res = await fetch("/api/admin/demo-project", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        setHasDemoProject(true)
        return
      }
      const data = (await res.json()) as { project: unknown }
      setHasDemoProject(Boolean(data.project))
    } catch {
      setHasDemoProject(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (hasDemoProject !== false) return null

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
    >
      No demo project is configured. Approving requests will fail until an admin
      sets one under{" "}
      <Link href="/projects" className="font-medium underline hover:text-arse-cyan">
        Projects
      </Link>{" "}
      → Settings → <strong>Use as demo project</strong>.
    </div>
  )
}
