import { NextResponse } from "next/server"
import { z } from "zod"
import {
  clearActiveDemoProject,
  getActiveDemoProject,
  setActiveDemoProject,
} from "@/lib/demo-access/demo-project"
import {
  requireDashboardAdmin,
  type ApiError,
} from "@/lib/api/require-dashboard-admin"

export async function GET(request: Request) {
  const authResult = await requireDashboardAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { adminClient } = authResult

  try {
    const project = await getActiveDemoProject(adminClient)
    if (!project) {
      return NextResponse.json({ project: null })
    }
    return NextResponse.json({
      project: {
        projectId: project.id,
        projectName: project.name,
        organizationId: project.organizationId,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load demo project."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }
}

const putBodySchema = z.object({
  projectId: z.string().uuid(),
})

export async function PUT(request: Request) {
  const authResult = await requireDashboardAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { adminClient } = authResult

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid JSON body." },
      { status: 400 }
    )
  }

  const parsed = putBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: "projectId must be a valid UUID." },
      { status: 400 }
    )
  }

  try {
    await setActiveDemoProject(adminClient, parsed.data.projectId)
    const project = await getActiveDemoProject(adminClient)
    return NextResponse.json({
      project: project
        ? {
            projectId: project.id,
            projectName: project.name,
            organizationId: project.organizationId,
          }
        : null,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to set demo project."
    return NextResponse.json<ApiError>({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const authResult = await requireDashboardAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { adminClient } = authResult

  try {
    await clearActiveDemoProject(adminClient)
    return NextResponse.json({ project: null })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to clear demo project."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }
}
