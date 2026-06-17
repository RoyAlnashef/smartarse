const FORM_FIELD_SELECTOR =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([type="image"]):not([type="hidden"]), textarea, select, [contenteditable="true"]'

export function isFormFieldElement(element: Element | null): boolean {
  return !!element && element.matches(FORM_FIELD_SELECTOR)
}

function isIosBrowser(): boolean {
  if (typeof navigator === "undefined") return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

export function resetMobileBrowserZoom(): void {
  if (typeof document === "undefined" || !isIosBrowser()) return

  const meta = document.querySelector('meta[name="viewport"]')
  if (!meta) return

  const content = meta.getAttribute("content") ?? "width=device-width, initial-scale=1"
  if (content.includes("maximum-scale=1")) return

  meta.setAttribute("content", `${content}, maximum-scale=1`)
  requestAnimationFrame(() => {
    meta.setAttribute("content", content)
  })
}
