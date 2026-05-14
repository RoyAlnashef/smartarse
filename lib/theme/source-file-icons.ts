import type { LucideIcon } from "lucide-react"
import {
  File,
  FileSpreadsheet,
  FileText,
  MessageSquareQuote,
  Presentation,
} from "lucide-react"
import type { UploadedFile } from "@/lib/types"

/** Keep in sync with `supabase/migrations/*_project_documents_source_icon_key*.sql` CHECK. */
export const SOURCE_FILE_ICON_KEYS = [
  "pdf",
  "spreadsheet",
  "document",
  "presentation",
  "markdown",
  "interview",
] as const

export type SourceFileIconKey = (typeof SOURCE_FILE_ICON_KEYS)[number]

export function isSourceFileIconKey(value: string): value is SourceFileIconKey {
  return (SOURCE_FILE_ICON_KEYS as readonly string[]).includes(value)
}

const iconByKey: Record<SourceFileIconKey, LucideIcon> = {
  pdf: FileText,
  spreadsheet: FileSpreadsheet,
  document: File,
  presentation: Presentation,
  markdown: FileText,
  interview: MessageSquareQuote,
}

/** Coarse `UploadedFile.type` from `inferUploadedFileType` → Lucide (no DB override). */
const iconByInferredType: Record<string, LucideIcon> = {
  pdf: FileText,
  csv: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  md: FileText,
  doc: File,
}

export function lucideIconForSourceFileKey(key: SourceFileIconKey): LucideIcon {
  return iconByKey[key]
}

/**
 * Icon for lists and tables: admin override, else same inference as before (`file.type`).
 */
export function lucideIconForProjectDocument(
  file: Pick<UploadedFile, "type" | "sourceIconKey">
): LucideIcon {
  const raw = file.sourceIconKey?.trim()
  if (raw && isSourceFileIconKey(raw)) {
    return lucideIconForSourceFileKey(raw)
  }
  return iconByInferredType[file.type] ?? File
}

/**
 * Citation tooltip/footer: resolve Lucide when `iconName` stores an allowlisted key.
 */
export function lucideIconForCitationIconName(
  iconName: string | null | undefined
): LucideIcon | null {
  const t = iconName?.trim()
  if (!t || !isSourceFileIconKey(t)) return null
  return lucideIconForSourceFileKey(t)
}

/** Fallback inference when no explicit key (e.g. legacy citations). */
export function lucideIconForInferredFileType(fileType: string): LucideIcon {
  return iconByInferredType[fileType] ?? File
}
