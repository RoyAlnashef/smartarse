"use client"

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { cn } from "@/lib/utils"

export type HsvaColor = {
  h: number
  s: number
  v: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function hsvaToRgba({ h, s, v }: HsvaColor): { r: number; g: number; b: number } {
  const hh = ((h % 360) + 360) % 360
  const sat = clamp(s, 0, 1)
  const val = clamp(v, 0, 1)
  const c = val * sat
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = val - c

  let r1 = 0
  let g1 = 0
  let b1 = 0

  if (hh < 60) [r1, g1, b1] = [c, x, 0]
  else if (hh < 120) [r1, g1, b1] = [x, c, 0]
  else if (hh < 180) [r1, g1, b1] = [0, c, x]
  else if (hh < 240) [r1, g1, b1] = [0, x, c]
  else if (hh < 300) [r1, g1, b1] = [x, 0, c]
  else [r1, g1, b1] = [c, 0, x]

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

export function rgbCss(color: { r: number; g: number; b: number }): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`
}

const SATURATION_KEYBOARD_STEP = 0.02
const VALUE_KEYBOARD_STEP = 0.02
const HUE_KEYBOARD_STEP = 2

type AdvancedColorPickerProps = {
  value: HsvaColor
  onChange: (value: HsvaColor) => void
  className?: string
}

export function AdvancedColorPicker({ value, onChange, className }: AdvancedColorPickerProps) {
  const satRef = useRef<HTMLDivElement | null>(null)
  const hueRef = useRef<HTMLDivElement | null>(null)
  const hueDragActiveRef = useRef(false)
  const [dragging, setDragging] = useState(false)

  const fullColor = useMemo(() => rgbCss(hsvaToRgba(value)), [value])

  const setSaturationValueFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const el = satRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clamp(event.clientX - rect.left, 0, rect.width)
    const y = clamp(event.clientY - rect.top, 0, rect.height)
    onChange({
      ...value,
      s: rect.width === 0 ? value.s : x / rect.width,
      v: rect.height === 0 ? value.v : 1 - y / rect.height,
    })
  }

  const onSatKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      onChange({ ...value, s: clamp(value.s - SATURATION_KEYBOARD_STEP, 0, 1) })
      return
    }
    if (event.key === "ArrowRight") {
      event.preventDefault()
      onChange({ ...value, s: clamp(value.s + SATURATION_KEYBOARD_STEP, 0, 1) })
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      onChange({ ...value, v: clamp(value.v + VALUE_KEYBOARD_STEP, 0, 1) })
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      onChange({ ...value, v: clamp(value.v - VALUE_KEYBOARD_STEP, 0, 1) })
    }
  }

  const normalizeHue = (h: number) => ((h % 360) + 360) % 360

  const setHueFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const el = hueRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clamp(event.clientX - rect.left, 0, rect.width)
    const h = rect.width === 0 ? value.h : (x / rect.width) * 360
    onChange({ ...value, h: normalizeHue(h) })
  }

  const onHueKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      onChange({ ...value, h: normalizeHue(value.h - HUE_KEYBOARD_STEP) })
      return
    }
    if (event.key === "ArrowRight") {
      event.preventDefault()
      onChange({ ...value, h: normalizeHue(value.h + HUE_KEYBOARD_STEP) })
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={satRef}
        role="slider"
        aria-label="Saturation and value"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value.s * 100)}
        tabIndex={0}
        onKeyDown={onSatKeyDown}
        onPointerDown={(event) => {
          setDragging(true)
          setSaturationValueFromPointer(event)
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (!dragging) return
          setSaturationValueFromPointer(event)
        }}
        onPointerUp={(event) => {
          setDragging(false)
          event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        className="relative h-56 w-full cursor-crosshair overflow-hidden rounded-xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{
          backgroundColor: `hsl(${value.h} 100% 50%)`,
          backgroundImage:
            "linear-gradient(to right, #ffffff, rgba(255,255,255,0)), linear-gradient(to top, #000000, rgba(0,0,0,0))",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.25)]"
          style={{ left: `${value.s * 100}%`, top: `${(1 - value.v) * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-3">
        <span
          className="h-8 w-8 shrink-0 rounded-md border border-border shadow-sm"
          style={{ background: fullColor }}
          aria-label="Selected color preview"
        />
        <div className="w-full space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Hue</p>
            <div
              ref={hueRef}
              role="slider"
              aria-label="Hue"
              aria-valuemin={0}
              aria-valuemax={360}
              aria-valuenow={Math.round(normalizeHue(value.h))}
              tabIndex={0}
              onKeyDown={onHueKeyDown}
              onPointerDown={(event) => {
                hueDragActiveRef.current = true
                setHueFromPointer(event)
                event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerMove={(event) => {
                if (!hueDragActiveRef.current) return
                setHueFromPointer(event)
              }}
              onPointerUp={(event) => {
                hueDragActiveRef.current = false
                event.currentTarget.releasePointerCapture(event.pointerId)
              }}
              onPointerCancel={() => {
                hueDragActiveRef.current = false
              }}
              onLostPointerCapture={() => {
                hueDragActiveRef.current = false
              }}
              className="relative h-6 w-full cursor-ew-resize touch-none rounded-md border border-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                background:
                  "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.35)]"
                style={{ left: `${(normalizeHue(value.h) / 360) * 100}%` }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
