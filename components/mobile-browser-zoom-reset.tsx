"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { isFormFieldElement, resetMobileBrowserZoom } from "@/lib/mobile-browser-zoom"

export function MobileBrowserZoomReset() {
  const pathname = usePathname()

  useEffect(() => {
    resetMobileBrowserZoom()
  }, [pathname])

  useEffect(() => {
    function handleFocusOut(event: FocusEvent) {
      const relatedTarget = event.relatedTarget
      if (relatedTarget instanceof Element && isFormFieldElement(relatedTarget)) return

      requestAnimationFrame(() => {
        if (!isFormFieldElement(document.activeElement)) {
          resetMobileBrowserZoom()
        }
      })
    }

    document.addEventListener("focusout", handleFocusOut)
    return () => document.removeEventListener("focusout", handleFocusOut)
  }, [])

  return null
}
