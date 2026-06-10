/** Strip path separators, null bytes, and leading dots from storage object names. */
export function sanitizeStorageFileName(name: string): string {
  const withoutNulls = name.replace(/\0/g, "")
  const base = withoutNulls.replace(/[/\\]/g, "-").replace(/^\.+/, "").trim()
  return base.slice(0, 200) || "file"
}
