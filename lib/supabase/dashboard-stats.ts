"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type DashboardStatsCounts = {
  queries: number
  projects: number
  users: number
  organizations: number
}

/**
 * Row counts for the dashboard stat bar. Uses the browser Supabase client so RLS applies
 * (`chat_results`, `projects`, `users`, `organizations`).
 */
export async function fetchDashboardStatsCounts(): Promise<DashboardStatsCounts> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return { queries: 0, projects: 0, users: 0, organizations: 0 }
  }

  const countTable = async (table: string) => {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
    if (error) throw new Error(error.message)
    return count ?? 0
  }

  const [queries, projects, users, organizations] = await Promise.all([
    countTable("chat_results"),
    countTable("projects"),
    countTable("users"),
    countTable("organizations"),
  ])
  return { queries, projects, users, organizations }
}
