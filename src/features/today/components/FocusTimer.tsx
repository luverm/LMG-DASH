import { ShapeButton } from '@/components/ui/ShapeButton'
import type { FocusPreset, FocusSession } from '@/features/workday/types'
import { formatClock } from '@/lib/time'
import styles from './FocusTimer.module.css'

interface FocusTimerProps {
  session?: FocusSession
  preset: FocusPreset
  /** Work time in the current focus stretch. */
  workMs: number
  /** Running focus-break time, when on a focus break. */
  breakMs?: number
  onStart(): void
  onEnd(): void
  onBackToWork(): void
}

/** Pomodoro-style focus cycles: shows time left in the stretch or the break. */
export function FocusTimer({
  session,
  preset,
  workMs,
  breakMs,
  onStart,
  onEnd,
  onBackToWork,
}: FocusTimerProps) {
  if (!session) {
    return (
      <ShapeButton
        shape="hexagon"
        size="sm"
        variant="ghost"
        onClick={onStart}
        title="Work in focus cycles"
      >
        Focus timer {preset}
      </ShapeButton>
    )
  }
  const onBreak = breakMs != null
  const leftMs = onBreak
    ? session.breakMinutes * 60_000 - breakMs
    : session.workMinutes * 60_000 - workMs
  const over = leftMs <= 0
  const progress = onBreak
    ? Math.min(1, breakMs / (session.breakMinutes * 60_000))
    : Math.min(1, workMs / (session.workMinutes * 60_000))

  return (
    <div className={`${styles.timer} ${onBreak ? styles.onBreak : ''}`} role="status">
      <span className={styles.bar} style={{ ['--p' as string]: progress }} aria-hidden />
      <span className={styles.label}>
        {onBreak ? (over ? "Break's over" : 'Focus break') : `Focus · cycle ${session.cycles + 1}`}
      </span>
      {!over && <span className="tabular">{formatClock(leftMs).replace(/^0:/, '')} left</span>}
      {onBreak && over && (
        <ShapeButton shape="circle" size="sm" variant="solid" onClick={onBackToWork}>
          Back to work
        </ShapeButton>
      )}
      <ShapeButton shape="square" size="sm" variant="ghost" onClick={onEnd}>
        End focus
      </ShapeButton>
    </div>
  )
}
