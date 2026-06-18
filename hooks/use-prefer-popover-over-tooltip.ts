"use client"

import { useSyncExternalStore } from "react"

/** Hover tooltips flash open/closed on touch; use tap-to-toggle popovers instead. */
export const PREFER_POPOVER_OVER_TOOLTIP_MQ =
  "(hover: none), (pointer: coarse), (max-width: 767px)"

function subscribePreferPopoverOverTooltip(onStoreChange: () => void) {
  const mq = window.matchMedia(PREFER_POPOVER_OVER_TOOLTIP_MQ)
  mq.addEventListener("change", onStoreChange)
  return () => mq.removeEventListener("change", onStoreChange)
}

function getPreferPopoverOverTooltipSnapshot() {
  return window.matchMedia(PREFER_POPOVER_OVER_TOOLTIP_MQ).matches
}

function getPreferPopoverOverTooltipServerSnapshot() {
  return false
}

export function usePreferPopoverOverTooltip() {
  return useSyncExternalStore(
    subscribePreferPopoverOverTooltip,
    getPreferPopoverOverTooltipSnapshot,
    getPreferPopoverOverTooltipServerSnapshot,
  )
}
