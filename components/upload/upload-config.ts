/** Shown on dropzones and upload dialogs; keep in sync with `FILE_UPLOAD_ACCEPT`. */
export const FILE_UPLOAD_TYPES_DESCRIPTION =
  ".pdf .pptx .doc .docx .xls .xlsx and .csv files up to 50MB"

export const FILE_UPLOAD_ACCEPT = ".pdf,.pptx,.doc,.docx,.xls,.xlsx,.csv"

/** 50 MiB — keep copy in `FILE_UPLOAD_TYPES_DESCRIPTION` aligned. */
export const FILE_UPLOAD_MAX_BYTES = 50 * 1024 * 1024

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "pptx",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
])

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".")
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ""
}

/** Map extension to coarse `UploadedFile.type` for icons (pdf, csv, xlsx, …). */
export function inferUploadedFileType(extension: string): string {
  const e = extension.toLowerCase()
  if (e === "csv") return "csv"
  if (e === "xls" || e === "xlsx") return "xlsx"
  if (e === "pdf") return "pdf"
  return "doc"
}

/**
 * Returns a user-facing error message, or `null` if the file is allowed.
 */
export function validateFileForUpload(file: File): string | null {
  const ext = fileExtension(file.name)
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return `${file.name}: use a supported type (${FILE_UPLOAD_TYPES_DESCRIPTION.split(" up to")[0].trim()}).`
  }
  if (file.size > FILE_UPLOAD_MAX_BYTES) {
    return `${file.name} is too large (max 50MB).`
  }
  return null
}
