import { NextResponse } from "next/server"
import { z } from "zod"
import {
  buildSignupConsentsMetadata,
  mergeDemoRequestMetadata,
  parseDemoCookiePreferencesPayload,
  parseSignupConsentsPayload,
} from "@/lib/demo-access/consent"
import { createDemoAccessRequest } from "@/lib/demo-access/request-service"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const bodySchema = z.object({
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  organizationName: z.string().trim().min(1).max(160),
  consents: z.record(z.string(), z.unknown()),
  cookiePreferences: z.record(z.string(), z.unknown()).optional(),
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

  const consentPayload = parseSignupConsentsPayload(parsed.data.consents)
  if (!consentPayload) {
    return NextResponse.json(GENERIC_SUCCESS)
  }

  let adminClient
  try {
    adminClient = getSupabaseAdminClient()
  } catch (error) {
    console.error("[demo/request] admin client", error)
    return NextResponse.json(GENERIC_SUCCESS)
  }

  const requestContext: Record<string, unknown> = {}
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) requestContext.ip = forwarded.split(",")[0]?.trim()
  const userAgent = request.headers.get("user-agent")
  if (userAgent) requestContext.userAgent = userAgent

  const cookiePreferences = parsed.data.cookiePreferences
    ? parseDemoCookiePreferencesPayload(parsed.data.cookiePreferences)
    : null
  const signupConsents = buildSignupConsentsMetadata(
    consentPayload,
    cookiePreferences
  )
  const metadata = mergeDemoRequestMetadata(null, signupConsents, requestContext)

  try {
    const result = await createDemoAccessRequest(adminClient, {
      email: parsed.data.email,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      organizationName: parsed.data.organizationName,
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
