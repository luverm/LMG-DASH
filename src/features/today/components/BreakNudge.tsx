import { useState } from 'react'
import { Shape } from '@/components/shapes/Shape'
import { ShapeButton } from '@/components/ui/ShapeButton'
import type { BreakType } from '@/features/workday/types'
import { formatDuration } from '@/lib/time'
import styles from './BreakNudge.module.css'

interface BreakNudgeProps {
  continuousMs: number
  afterMinutes: number
  now: Date
  onBreak(type: BreakType): void
}

/** A gentle, non-blocking "take a break?" after a long stretch of work. */
export function BreakNudge({ continuousMs, afterMinutes, now, onBreak }: BreakNudgeProps) {
  const [snoozedUntil, setSnoozedUntil] = useState(0)
  const show = continuousMs >= afterMinutes * 60_000 && now.getTime() >= snoozedUntil
  if (!show) return null

  const snooze = (minutes: number) => setSnoozedUntil(now.getTime() + minutes * 60_000)
  return (
    <div className={styles.toast} role="status">
      <Shape kind="triangle" size={22} filled />
      <span className={styles.text}>
        You've been at it for {formatDuration(continuousMs)}. Take a break?
      </span>
      <div className={styles.actions}>
        <ShapeButton shape="triangle" size="sm" variant="solid" onClick={() => onBreak('coffee')}>
          Coffee
        </ShapeButton>
        <ShapeButton shape="triangle" size="sm" onClick={() => onBreak('walk')}>
          Walk
        </ShapeButton>
        <ShapeButton shape="circle" size="sm" variant="ghost" onClick={() => snooze(15)}>
          In 15 min
        </ShapeButton>
      </div>
    </div>
  )
}
