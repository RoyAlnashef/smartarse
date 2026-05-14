import type { ChatCitationSource, UploadedFile } from "@/lib/types"

/** Project documents passed into chat for tooltips and citation color merge (order = source index). */
export type CitationDocumentRef = Pick<
  UploadedFile,
  "id" | "name" | "displayName" | "citeColorToken" | "sourceIconKey"
>

/** Drop the last `.<ext>` segment; keep the original if there is no stem. */
export function fileNameWithoutExtension(name: string): string {
  const dot = name.lastIndexOf(".")
  if (dot <= 0 || dot === name.length - 1) return name
  return name.slice(0, dot)
}

/** Sources sidebar: prefer custom display name, else filename without extension. */
export function sourceListLabel(file: Pick<UploadedFile, "name" | "displayName">): string {
  const custom = file.displayName?.trim()
  if (custom) return custom
  return fileNameWithoutExtension(file.name)
}

/** Admin table primary cell: show display name when set, else storage/file name. */
export function adminDocumentPrimaryLabel(
  file: Pick<UploadedFile, "name" | "displayName">
): string {
  const custom = file.displayName?.trim()
  return custom || file.name
}

/** Tooltip / title text for a document (friendly + file name for disambiguation). */
export function citationDocumentTooltip(file: CitationDocumentRef): string {
  const label = sourceListLabel(file)
  if (label === file.name || label === fileNameWithoutExtension(file.name)) {
    return file.name
  }
  return `${label} (${file.name})`
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return null
}

/** Aggregate survey citations from the assistant payload (`source_type` / `type` → `sourceType`). */
export function isSurveyCitationSource(source: ChatCitationSource): boolean {
  return source.sourceType?.trim().toLowerCase() === "survey"
}

/** Preferred tooltip title for a chat citation source entry. */
export function citationSourcePrimaryLabel(source: ChatCitationSource): string {
  if (isSurveyCitationSource(source)) return "Survey Data"
  return (
    firstNonEmpty(source.displayName, source.documentTitle, source.sourceFileName) ??
    `Source [${source.index}]`
  )
}

/** Richer tooltip title when filename adds useful context. */
export function citationSourceTooltipLabel(source: ChatCitationSource): string {
  const primary = citationSourcePrimaryLabel(source)
  const fileName = firstNonEmpty(source.sourceFileName)
  if (!fileName || primary === fileName || primary === fileNameWithoutExtension(fileName)) {
    return primary
  }
  return `${primary} (${fileName})`
}

export type CitationLabelLookup = {
  /** Lowercase UUID -> tooltip string */
  byId: Map<string, string>
  /** Exact filename -> tooltip */
  byFileName: Map<string, string>
  /** Stem without extension -> tooltip (first wins if collision) */
  byStem: Map<string, string>
}

export function buildCitationLabelLookup(docs: CitationDocumentRef[]): CitationLabelLookup {
  const byId = new Map<string, string>()
  const byFileName = new Map<string, string>()
  const byStem = new Map<string, string>()
  for (const d of docs) {
    const tip = citationDocumentTooltip(d)
    byId.set(d.id.toLowerCase(), tip)
    byFileName.set(d.name, tip)
    const stem = fileNameWithoutExtension(d.name)
    if (!byStem.has(stem)) byStem.set(stem, tip)
  }
  return { byId, byFileName, byStem }
}

/**
 * If href/title refers to a known project document, return a friendlier tooltip.
 * Otherwise returns `existingTitle` unchanged.
 */
export function resolveCitationLinkTitle(
  lookup: CitationLabelLookup,
  href: string | undefined,
  existingTitle: string | undefined
): string | undefined {
  const hrefStr = href?.trim() ?? ""
  const titleStr = existingTitle?.trim() ?? ""

  const uuidInHref =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.exec(hrefStr)?.[0]
  if (uuidInHref) {
    const hit = lookup.byId.get(uuidInHref.toLowerCase())
    if (hit) return hit
  }

  let decoded = hrefStr
  try {
    decoded = decodeURIComponent(hrefStr)
  } catch {
    /* keep hrefStr */
  }

  for (const [fname, tip] of lookup.byFileName) {
    if (fname && (decoded === fname || decoded.endsWith(`/${fname}`) || decoded.includes(fname))) {
      return tip
    }
  }

  if (titleStr) {
    const byTitle = lookup.byFileName.get(titleStr)
    if (byTitle) return byTitle
    const byStem = lookup.byStem.get(titleStr)
    if (byStem) return byStem
  }

  return existingTitle
}

/**
 * Fills `citeColorToken` on each citation from the ordered project document list when the
 * payload did not include it (index 1 → docs[0]). Preserves existing tokens from the API.
 */
export function mergeCitationSourcesWithDocColors(
  sources: ChatCitationSource[],
  orderedDocs: CitationDocumentRef[]
): ChatCitationSource[] {
  return sources.map((source) => {
    const existing = source.citeColorToken?.trim()
    if (existing) {
      return source
    }
    const doc = orderedDocs[source.index - 1]
    const token = doc?.citeColorToken?.trim()
    if (!token) return source
    return { ...source, citeColorToken: token }
  })
}

/**
 * Fills `iconName` when the payload omitted icon metadata; preserves n8n `iconUrl` / `iconName`.
 */
export function mergeCitationSourcesWithDocIcons(
  sources: ChatCitationSource[],
  orderedDocs: CitationDocumentRef[]
): ChatCitationSource[] {
  return sources.map((source) => {
    const url = source.iconUrl?.trim()
    if (url) return source
    const existingName = source.iconName?.trim()
    if (existingName) return source
    const doc = orderedDocs[source.index - 1]
    const key = doc?.sourceIconKey?.trim()
    if (!key) return source
    return { ...source, iconName: key }
  })
}
