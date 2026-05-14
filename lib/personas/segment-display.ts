import type { UploadedFile } from "@/lib/types"
import { SEGMENT_BRAND_DEFAULT_COLOR_TOKEN, isCiteColorToken } from "@/lib/theme/cite-color-tokens"
import { isCanonicalSegmentId } from "@/lib/personas/canonical-segments"
import { MOCK_SEGMENT_PERSONAS, type PersonaMock } from "@/lib/personas/segment-mocks"

/**
 * Merge baseline segment mocks with optional `project_personas` rows bound via `canonicalSegmentId`.
 */
export function resolveSegmentPersonasFromFiles(personaFiles: UploadedFile[]): PersonaMock[] {
  const bySegment = new Map<string, UploadedFile>()
  for (const file of personaFiles) {
    const sid = file.canonicalSegmentId?.trim()
    if (sid && isCanonicalSegmentId(sid)) {
      bySegment.set(sid, file)
    }
  }

  return MOCK_SEGMENT_PERSONAS.map((mock) => {
    const row = bySegment.get(mock.id)
    const rowToken = row?.segmentColorToken?.trim()
    const colorCiteToken =
      rowToken && isCiteColorToken(rowToken)
        ? rowToken
        : rowToken === SEGMENT_BRAND_DEFAULT_COLOR_TOKEN
          ? SEGMENT_BRAND_DEFAULT_COLOR_TOKEN
          : mock.colorCiteToken

    return {
      ...mock,
      title: row?.displayName?.trim() || mock.title,
      shortDescription: row?.segmentDescription?.trim() || mock.shortDescription,
      colorCiteToken,
      dotClassName:
        colorCiteToken === SEGMENT_BRAND_DEFAULT_COLOR_TOKEN
          ? "bg-arse-pink"
          : `bg-${colorCiteToken}`,
    }
  })
}

export function segmentPersonaById(
  list: PersonaMock[],
  id: string | null | undefined
): PersonaMock | null {
  const key = id?.trim()
  if (!key) return null
  return list.find((p) => p.id === key) ?? null
}
