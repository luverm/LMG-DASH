import { Shape } from './Shape'
import type { ShapeKind } from './shapes'
import styles from './ShapeBackdrop.module.css'

const floaters: { kind: ShapeKind; top: string; left: string; size: number; delay: number }[] = [
  { kind: 'circle', top: '8%', left: '6%', size: 220, delay: 0 },
  { kind: 'hexagon', top: '62%', left: '82%', size: 260, delay: -12 },
  { kind: 'triangle', top: '72%', left: '4%', size: 180, delay: -24 },
  { kind: 'square', top: '14%', left: '78%', size: 150, delay: -36 },
]

/** Large, faint shapes drifting slowly behind the content. */
export function ShapeBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden>
      {floaters.map((f) => (
        <div
          key={f.kind}
          className={styles.floater}
          style={{ top: f.top, left: f.left, animationDelay: `${f.delay}s` }}
        >
          <Shape kind={f.kind} size={f.size} strokeWidth={0.6} />
        </div>
      ))}
    </div>
  )
}
