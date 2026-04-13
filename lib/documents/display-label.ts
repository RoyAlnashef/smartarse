import type { UploadedFile } from "@/lib/types"

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

export type CitationDocumentRef = Pick<UploadedFile, "id" | "name" | "displayName">

/** Tooltip / title text for a document (friendly + file name for disambiguation). */
export function citationDocumentTooltip(file: CitationDocumentRef): string {
  const label = sourceListLabel(file)
  if (label === file.name || label === fileNameWithoutExtension(file.name)) {
    return file.name
  }
  return `${label} (${file.name})`
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
