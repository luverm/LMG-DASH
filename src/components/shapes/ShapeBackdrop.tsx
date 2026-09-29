import { useEffect, useRef } from 'react'
import { Shape } from './Shape'
import type { ShapeKind } from './shapes'
import styles from './ShapeBackdrop.module.css'

interface Floater {
  kind: ShapeKind
  /** Home position as a fraction of the viewport. */
  x: number
  y: number
  size: number
  color?: string
  /** Drift: radius in px and period in seconds, plus a phase so they don't move in sync. */
  drift: number
  period: number
  phase: number
}

const floaters: Floater[] = [
  { kind: 'circle', x: 0.1, y: 0.16, size: 220, drift: 40, period: 26, phase: 0 },
  { kind: 'hexagon', x: 0.88, y: 0.7, size: 260, drift: 36, period: 31, phase: 1.7 },
  { kind: 'triangle', x: 0.1, y: 0.8, size: 180, drift: 44, period: 23, phase: 3.1 },
  { kind: 'square', x: 0.84, y: 0.2, size: 150, drift: 38, period: 28, phase: 4.4 },
  {
    kind: 'hexagon',
    x: 0.5,
    y: 0.92,
    size: 120,
    color: 'var(--butter)',
    drift: 30,
    period: 35,
    phase: 2.2,
  },
  {
    kind: 'circle',
    x: 0.6,
    y: 0.08,
    size: 90,
    color: 'var(--sky)',
    drift: 26,
    period: 21,
    phase: 5.2,
  },
  {
    kind: 'triangle',
    x: 0.36,
    y: 0.5,
    size: 110,
    color: 'var(--lavender)',
    drift: 34,
    period: 33,
    phase: 0.8,
  },
]

/** How far (px) the cursor's influence reaches, and how hard shapes are pushed away. */
const REACH = 260
const PUSH = 90

interface Body {
  ox: number
  oy: number
  vx: number
  vy: number
  rot: number
  vr: number
  glow: number
}

/**
 * Large, faint shapes that drift slowly and move out of the way of the cursor
 * (or a finger), springing back afterwards. Static when reduced motion is preferred.
 */
export function ShapeBackdrop() {
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const bodies: Body[] = floaters.map(() => ({
      ox: 0,
      oy: 0,
      vx: 0,
      vy: 0,
      rot: 0,
      vr: 0,
      glow: 0,
    }))
    const pointer = { x: -9999, y: -9999, active: false }
    let frame = 0
    let last = performance.now()

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.active = true
    }
    const onLeave = () => {
      pointer.active = false
    }

    const step = (now: number) => {
      // Clamp the time step so a backgrounded tab doesn't make shapes jump.
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = now / 1000
      const w = window.innerWidth
      const h = window.innerHeight

      floaters.forEach((f, i) => {
        const b = bodies[i]
        const el = refs.current[i]
        if (!el) return
        // Where the shape wants to be: its home plus a slow looping drift.
        const a = (t / f.period) * Math.PI * 2 + f.phase
        const tx = Math.cos(a) * f.drift
        const ty = Math.sin(a * 1.3) * f.drift * 0.8

        // Push away from the cursor, strongest when close.
        let fx = 0
        let fy = 0
        let near = 0
        if (pointer.active) {
          const cx = f.x * w + b.ox
          const cy = f.y * h + b.oy
          const dx = cx - pointer.x
          const dy = cy - pointer.y
          const dist = Math.hypot(dx, dy) || 1
          const reach = REACH + f.size / 2
          if (dist < reach) {
            near = 1 - dist / reach
            fx = (dx / dist) * near * PUSH
            fy = (dy / dist) * near * PUSH
          }
        }

        // Spring toward the target (drift + push), with damping.
        const k = 6
        const damping = 0.86
        b.vx = (b.vx + (tx + fx - b.ox) * k * dt) * damping
        b.vy = (b.vy + (ty + fy - b.oy) * k * dt) * damping
        b.ox += b.vx * dt * 12
        b.oy += b.vy * dt * 12

        // A little spin while being pushed, and a soft glow near the cursor.
        b.vr = (b.vr + (near * 40 - b.rot * 0.5) * dt) * 0.92
        b.rot += b.vr * dt * 10
        b.glow += (near - b.glow) * Math.min(1, dt * 6)

        el.style.transform = `translate(${b.ox}px, ${b.oy}px) rotate(${b.rot + Math.sin(a) * 6}deg)`
        el.style.opacity = String(0.09 + b.glow * 0.16)
      })
      frame = requestAnimationFrame(step)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
    frame = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [])

  return (
    <div className={styles.backdrop} aria-hidden>
      {floaters.map((f, i) => (
        <div
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          className={styles.floater}
          style={{
            left: `${f.x * 100}%`,
            top: `${f.y * 100}%`,
            marginLeft: -f.size / 2,
            marginTop: -f.size / 2,
          }}
        >
          <Shape kind={f.kind} size={f.size} strokeWidth={0.6} color={f.color} />
        </div>
      ))}
    </div>
  )
}
