import type { SupabaseClient } from "@supabase/supabase-js"
import {
  toDemoAccessRequestDto,
  type DemoAccessRequestDto,
  type DemoAccessRequestRow,
  type DemoAccessRequestStatus,
} from "@/lib/demo-access/types"

export async function listDemoAccessRequests(
  adminClient: SupabaseClient,
  options: {
    status?: DemoAccessRequestStatus | "all"
    page?: number
    limit?: number
  }
): Promise<{ items: DemoAccessRequestDto[]; total: number }> {
  const page = Math.max(1, options.page ?? 1)
  const limit = Math.min(100, Math.max(1, options.limit ?? 50))
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = adminClient
    .from("demo_access_requests")
    .select("*", { count: "exact" })
    .order("requested_at", { ascending: false })

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status)
  }

  const { data, error, count } = await query.range(from, to)
  if (error) throw new Error(error.message)

  return {
    items: (data ?? []).map((row) =>
      toDemoAccessRequestDto(row as DemoAccessRequestRow)
    ),
    total: count ?? 0,
  }
}
