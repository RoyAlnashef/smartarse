export async function requestEvaluateCreditAlert(
  projectId: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(
    `/api/admin/projects/${encodeURIComponent(projectId)}/evaluate-credit-alert`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )

  if (!res.ok) {
    let message = "Failed to evaluate credit alert."
    try {
      const data = (await res.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }
}
