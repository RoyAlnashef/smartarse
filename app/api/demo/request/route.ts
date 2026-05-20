import { NextResponse } from "next/server"
import { z } from "zod"
import { createDemoAccessRequest } from "@/lib/demo-access/request-service"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const bodySchema = z.object({
  email: z.string().trim().email(),
})

const GENERIC_SUCCESS = {
  message: "We'll be in touch if approved.",
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(GENERIC_SUCCESS)
  }

  let adminClient
  try {
    adminClient = getSupabaseAdminClient()
  } catch (error) {
    console.error("[demo/request] admin client", error)
    return NextResponse.json(GENERIC_SUCCESS)
  }

  const metadata: Record<string, unknown> = {}
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) metadata.ip = forwarded.split(",")[0]?.trim()
  const userAgent = request.headers.get("user-agent")
  if (userAgent) metadata.userAgent = userAgent

  try {
    const result = await createDemoAccessRequest(adminClient, {
      email: parsed.data.email,
      metadata,
    })
    if (!result.ok && result.reason === "rate_limited") {
      return NextResponse.json(GENERIC_SUCCESS)
    }
  } catch (error) {
    console.error("[demo/request]", error)
  }

  return NextResponse.json(GENERIC_SUCCESS)
}
