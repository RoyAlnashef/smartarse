"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

type DemoProjectInfo = {
  projectId: string
  projectName: string
}

export function DemoProjectSetting({ projectId }: { projectId: string }) {
  const [activeDemo, setActiveDemo] = useState<DemoProjectInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const isThisProjectDemo = activeDemo?.projectId === projectId

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setIsLoading(false)
      return
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/demo-project", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error("Failed to load demo project setting.")
      const data = (await res.json()) as { project: DemoProjectInfo | null }
      setActiveDemo(data.project)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load demo project."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function setAsDemo() {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      toast.error("Session expired. Sign in again.")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/demo-project", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      })
      const body = (await res.json()) as {
        error?: string
        project?: DemoProjectInfo | null
      }
      if (!res.ok) {
        toast.error(body.error ?? "Failed to set demo project.")
        return
      }
      setActiveDemo(body.project ?? null)
      toast.success("This project is now the demo entry point.")
    } catch {
      toast.error("Failed to set demo project.")
    } finally {
      setIsSaving(false)
    }
  }

  async function clearDemo() {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      toast.error("Session expired. Sign in again.")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/demo-project", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const body = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(body.error ?? "Failed to clear demo project.")
        return
      }
      setActiveDemo(null)
      toast.success("Demo project cleared.")
    } catch {
      toast.error("Failed to clear demo project.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading demo settings…</p>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">Demo access</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Approved demo users are assigned to this project and land here after
          their magic link. Only one demo project can be active at a time.
        </p>
      </div>
      {isThisProjectDemo ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-emerald-700">
            This is the active demo project
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSaving}
            onClick={() => void clearDemo()}
          >
            Clear demo project
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {activeDemo ? (
            <p className="text-sm text-muted-foreground">
              Current demo project:{" "}
              <span className="font-medium text-foreground">
                {activeDemo.projectName}
              </span>
              . Setting this project will replace it.
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            disabled={isSaving}
            onClick={() => void setAsDemo()}
          >
            Use as demo project
          </Button>
        </div>
      )}
    </div>
  )
}
