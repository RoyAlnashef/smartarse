"use client"

import { useEffect, useRef } from "react"

const MAX_DPR = 2

type FlowSession = {
  /** Hashes + seed placement vary per page load */
  seedSalt: number
  /** Offsets the animated time term so motion phase differs each load */
  timePhase: number
  /** Extra phase in each flow-field sine (radians) */
  field0: number
  field1: number
  field2: number
}

function createFlowSession(): FlowSession {
  return {
    seedSalt: Math.random() * 10000,
    timePhase: Math.random() * Math.PI * 2,
    field0: Math.random() * Math.PI * 2,
    field1: Math.random() * Math.PI * 2,
    field2: Math.random() * Math.PI * 2,
  }
}

/** Stable 0–1 from index (no flicker between frames). */
function hash01(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453123
  return x - Math.floor(x)
}

function flowAngle(
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  session: FlowSession,
): number {
  const nx = x / Math.max(w, 1)
  const ny = y / Math.max(h, 1)
  const scale = 0.0026
  const s =
    Math.sin(x * scale + ny * 3.1 + t * 0.11 + session.field0) * 1.05 +
    Math.sin(y * scale * 1.35 - nx * 2.2 + t * 0.085 + session.field1) * 0.82 +
    Math.sin((x - y) * scale * 0.65 + t * 0.14 + session.field2) * 0.48
  const base = -Math.PI / 2 + (Math.PI / 3.1) * Math.pow(Math.max(nx, 0), 0.82)
  return base + s * 0.42
}

function traceStreamline(
  startX: number,
  startY: number,
  w: number,
  h: number,
  t: number,
  step: number,
  maxSteps: number,
  session: FlowSession,
): [number, number][] {
  const pts: [number, number][] = []
  let x = startX
  let y = startY
  for (let i = 0; i < maxSteps; i++) {
    if (x < -24 || x > w + 24 || y < -24 || y > h + 24) break
    pts.push([x, y])
    const ang = flowAngle(x, y, w, h, t, session)
    x += Math.cos(ang) * step
    y += Math.sin(ang) * step
  }
  return pts
}

function buildSeeds(w: number, h: number, session: FlowSession): [number, number][] {
  const seeds: [number, number][] = []
  const salt = session.seedSalt
  const countJitter = 0.88 + hash01(0, salt + 99) * 0.24
  const bottomCount = Math.round((48 + (w / 900) * 36) * countJitter)
  const leftCount = Math.round((22 + (h / 700) * 18) * countJitter)

  for (let i = 0; i < bottomCount; i++) {
    const u = (i + 0.35) / bottomCount
    const bias = u * u
    let x = w * (0.04 + bias * 0.94)
    x += (hash01(i, salt + 10) - 0.5) * w * 0.07
    const yStart = h + 2 + (hash01(i, salt + 11) - 0.5) * 14
    if (x < w * 0.18 && hash01(i, salt + 2) < 0.35) continue
    seeds.push([x, yStart])
  }

  for (let i = 0; i < leftCount; i++) {
    const u = (i + 0.2) / leftCount
    let y = h * (0.42 + u * 0.58)
    y += (hash01(i, salt + 12) - 0.5) * h * 0.06
    const xStart = -2 + (hash01(i, salt + 13) - 0.5) * 22
    seeds.push([xStart, y])
  }

  return seeds
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  seeds: [number, number][],
  session: FlowSession,
) {
  ctx.clearRect(0, 0, w, h)

  const step = 2.1
  const maxSteps = Math.min(420, Math.ceil((w + h) / 2.8))
  const salt = session.seedSalt

  for (let i = 0; i < seeds.length; i++) {
    const [sx, sy] = seeds[i]
    const pts = traceStreamline(sx, sy, w, h, t, step, maxSteps, session)
    if (pts.length < 6) continue

    const h1 = hash01(i, salt)
    const h2 = hash01(i, salt + 1)
    const h3 = hash01(i, salt + 3)
    const thin = h1 < 0.55 ? 0.6 + h2 * 0.55 : 1.1 + h2 * 1.15
    const alpha = 0.16 + h2 * 0.28
    const glow = h3 < 0.35

    let r: number
    let g: number
    let b: number
    // Bias most strokes toward white / pale cyan so they read lighter on --arse-cyan
    if (h1 < 0.48) {
      r = 232 + h2 * 23
      g = 255
      b = 255
    } else if (h1 < 0.82) {
      r = 198 + h2 * 42
      g = 248 + h2 * 7
      b = 252 + h2 * 3
    } else {
      r = 148 + h2 * 38
      g = 232 + h2 * 20
      b = 244 + h2 * 11
    }

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.lineWidth = thin
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = `rgb(${r | 0},${g | 0},${b | 0})`

    if (glow) {
      ctx.shadowBlur = 6 + h2 * 8
      ctx.shadowColor = `rgba(${r | 0},${g | 0},${b | 0},0.45)`
    } else {
      ctx.shadowBlur = 0
    }

    if (hash01(i, salt + 4) < 0.42) {
      const dash = 4 + Math.floor(hash01(i, salt + 5) * 18)
      const gap = 3 + Math.floor(hash01(i, salt + 6) * 14)
      ctx.setLineDash([dash, gap])
      ctx.lineDashOffset = hash01(i, salt + 7) * 40
    } else {
      ctx.setLineDash([])
    }

    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let p = 1; p < pts.length; p++) {
      ctx.lineTo(pts[p][0], pts[p][1])
    }
    ctx.stroke()
    ctx.restore()
  }
}

export function LoginFlowBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const seedsRef = useRef<[number, number][]>([])
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    const canvasEl = canvasRef.current
    const containerEl = containerRef.current
    if (!canvasEl || !containerEl) return

    const ctxMaybe = canvasEl.getContext("2d")
    if (!ctxMaybe) return
    const c2d = ctxMaybe
    const shell = containerEl
    const surface = canvasEl

    const flowSession = createFlowSession()

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

    function resize() {
      const rect = shell.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const bw = Math.max(1, Math.floor(rect.width))
      const bh = Math.max(1, Math.floor(rect.height))
      surface.width = Math.floor(bw * dpr)
      surface.height = Math.floor(bh * dpr)
      surface.style.width = `${bw}px`
      surface.style.height = `${bh}px`
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0)
      seedsRef.current = buildSeeds(bw, bh, flowSession)
      if (reducedMotion.matches) {
        drawFrame(c2d, bw, bh, 0, seedsRef.current, flowSession)
      }
    }

    resize()

    const ro = new ResizeObserver(() => resize())
    ro.observe(shell)

    let running = true
    let tabHidden = document.hidden

    function scheduleNextFrame() {
      if (!running || tabHidden || reducedMotion.matches) return
      rafRef.current = requestAnimationFrame(loop)
    }

    function onVisibility() {
      tabHidden = document.hidden
      if (tabHidden) {
        cancelAnimationFrame(rafRef.current)
      } else if (running && !reducedMotion.matches) {
        scheduleNextFrame()
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    function loop(now: number) {
      if (!running || tabHidden) return
      if (!startRef.current) startRef.current = now
      const elapsed = (now - startRef.current) / 1000

      const rect = shell.getBoundingClientRect()
      const bw = Math.max(1, Math.floor(rect.width))
      const bh = Math.max(1, Math.floor(rect.height))

      const t = reducedMotion.matches ? 0 : elapsed + flowSession.timePhase
      drawFrame(c2d, bw, bh, t, seedsRef.current, flowSession)

      if (reducedMotion.matches) {
        running = false
        return
      }

      scheduleNextFrame()
    }

    if (reducedMotion.matches) {
      running = false
    } else {
      scheduleNextFrame()
    }

    const onMotionChange = () => {
      if (!reducedMotion.matches) {
        startRef.current = 0
        running = true
        cancelAnimationFrame(rafRef.current)
        scheduleNextFrame()
      } else {
        running = false
        cancelAnimationFrame(rafRef.current)
        const rect = shell.getBoundingClientRect()
        const bw = Math.max(1, Math.floor(rect.width))
        const bh = Math.max(1, Math.floor(rect.height))
        drawFrame(c2d, bw, bh, 0, seedsRef.current, flowSession)
      }
    }
    reducedMotion.addEventListener("change", onMotionChange)

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener("visibilitychange", onVisibility)
      reducedMotion.removeEventListener("change", onMotionChange)
      ro.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}
