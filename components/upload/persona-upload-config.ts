import { FILE_UPLOAD_MAX_BYTES } from "./upload-config"

/** Markdown-only personas bucket; keep in sync with `PERSONA_FILE_UPLOAD_ACCEPT`. */
export const PERSONA_FILE_UPLOAD_TYPES_DESCRIPTION =
  ".md files up to 50MB"

export const PERSONA_FILE_UPLOAD_ACCEPT = ".md"

const ALLOWED_EXTENSIONS = new Set(["md"])

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".")
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ""
}

/**
 * Returns a user-facing error message, or `null` if the file is allowed for personas.
 */
export function validatePersonaFileForUpload(file: File): string | null {
  const ext = fileExtension(file.name)
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return `${file.name}: use markdown only (${PERSONA_FILE_UPLOAD_TYPES_DESCRIPTION.split(" up to")[0].trim()}).`
  }
  if (file.size > FILE_UPLOAD_MAX_BYTES) {
    return `${file.name} is too large (max 50MB).`
  }
  return null
}
