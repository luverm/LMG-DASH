import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Shape } from '@/components/shapes/Shape'
import type { ShapeKind } from '@/components/shapes/shapes'
import type { DayRecord } from '@/features/workday/types'
import styles from './ClosingCelebration.module.css'

const MAX_SHAPES = 14

/** The day's shapes drop and stack into a little pile, once, when the day closes. */
export function ClosingCelebration({ day, onDone }: { day: DayRecord; onDone(): void }) {
  const shapes = useMemo(() => {
    const kinds: ShapeKind[] = [
      ...day.segments.map((s): ShapeKind => (s.kind === 'work' ? 'circle' : 'triangle')),
      ...day.plan.filter((i) => i.status === 'done').map((): ShapeKind => 'hexagon'),
      'square',
    ]
    return kinds.slice(-MAX_SHAPES)
  }, [day])

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const id = setTimeout(onDone, reduced ? 0 : 1100 + shapes.length * 90)
    return () => clearTimeout(id)
  }, [onDone, shapes.length])

  // Lay shapes out as a small pyramid: widest row at the bottom.
  const rows: ShapeKind[][] = []
  let rest = [...shapes]
  let width = Math.ceil((Math.sqrt(8 * shapes.length + 1) - 1) / 2)
  while (rest.length) {
    rows.unshift(rest.slice(0, width))
    rest = rest.slice(width)
    width = Math.max(1, width - 1)
  }
  let index = 0

  return createPortal(
    <div className={styles.overlay} aria-hidden>
      <div className={styles.pile}>
        {rows.map((row, r) => (
          <div key={r} className={styles.row}>
            {row.map((kind) => {
              const i = index++
              return (
                <span
                  key={i}
                  className={styles.shape}
                  style={{
                    animationDelay: `${i * 90}ms`,
                    ['--tilt' as string]: `${((i * 37) % 30) - 15}deg`,
                  }}
                >
                  <Shape kind={kind} size={34} filled />
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <p className={styles.caption}>Nice work today.</p>
    </div>,
    document.body,
  )
}
