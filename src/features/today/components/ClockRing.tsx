import { formatClock, formatMinutes } from '@/lib/time'
import type { DayState } from '@/features/workday/types'
import styles from './ClockRing.module.css'

interface ClockRingProps {
  state: DayState
  workMs: number
  targetMinutes: number
  /** Duration of the running break, shown instead of work time while on break. */
  breakMs?: number
  breakLabel?: string
}

const SIZE = 260
const STROKE = 14
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R

const stateLabel: Record<DayState, string> = {
  idle: 'Ready when you are',
  working: 'Working',
  paused: 'Paused',
  break: 'On a break',
  closed: 'Day closed',
}

export function ClockRing({ state, workMs, targetMinutes, breakMs, breakLabel }: ClockRingProps) {
  const targetMs = targetMinutes * 60_000
  const progress = targetMs > 0 ? Math.min(workMs / targetMs, 1) : 0
  const overMs = workMs - targetMs
  const onBreak = state === 'break'
  const color = onBreak ? 'var(--peach)' : 'var(--mint)'

  return (
    <div className={`${styles.wrap} ${state === 'working' ? styles.breathing : ''}`}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="progressbar"
        aria-label="Worked today"
        aria-valuemin={0}
        aria-valuemax={targetMinutes}
        aria-valuenow={Math.round(workMs / 60_000)}
      >
        <circle
          className={styles.track}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          strokeWidth={STROKE}
          fill="none"
        />
        <circle
          className={styles.progress}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          strokeWidth={STROKE}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <div className={styles.center}>
        <span className={styles.state} style={{ color: onBreak ? 'var(--peach)' : undefined }}>
          {onBreak ? (breakLabel ?? stateLabel.break) : stateLabel[state]}
        </span>
        <span className={`${styles.time} tabular`}>
          {formatClock(onBreak ? (breakMs ?? 0) : workMs)}
        </span>
        <span className={styles.sub}>
          {onBreak
            ? `worked ${formatClock(workMs)}`
            : overMs > 0
              ? `${formatMinutes(Math.round(overMs / 60_000))} past your ${formatMinutes(targetMinutes)}`
              : `of ${formatMinutes(targetMinutes)}`}
        </span>
      </div>
    </div>
  )
}
