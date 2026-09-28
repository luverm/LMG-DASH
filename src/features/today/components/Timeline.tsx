import { segmentMs } from '@/features/workday/day'
import type { DayRecord } from '@/features/workday/types'
import { formatDuration, formatTimeOfDay } from '@/lib/time'
import styles from './Timeline.module.css'

interface TimelineProps {
  day: DayRecord
  now: Date
  compact?: boolean
}

/** Work (mint) and break (peach) blocks laid out on the day's time span. */
export function Timeline({ day, now, compact }: TimelineProps) {
  const segments = [...day.segments].sort((a, b) => a.start.localeCompare(b.start))
  if (segments.length === 0) {
    return compact ? null : <div className={styles.empty}>Your day will appear here.</div>
  }
  const first = new Date(segments[0].start).getTime()
  const lastEnd = Math.max(
    ...segments.map((s) => (s.end ? new Date(s.end).getTime() : now.getTime())),
  )
  const span = Math.max(lastEnd - first, 60_000)

  return (
    <div className={compact ? styles.compact : undefined}>
      <div className={styles.track} role="img" aria-label="Timeline of today's work and breaks">
        {segments.map((s) => {
          const start = new Date(s.start).getTime()
          const ms = segmentMs(s, now)
          const label =
            s.kind === 'work'
              ? `${s.focus ?? 'Work'} · ${formatDuration(ms)}`
              : `${s.breakType ?? 'Break'} break · ${formatDuration(ms)}`
          return (
            <span
              key={s.id}
              className={`${styles.block} ${styles[s.kind]} ${s.end ? '' : styles.running}`}
              style={{
                left: `${((start - first) / span) * 100}%`,
                width: `max(3px, ${(ms / span) * 100}%)`,
              }}
              title={label}
            />
          )
        })}
      </div>
      {!compact && (
        <div className={styles.axis}>
          <span>{formatTimeOfDay(new Date(first))}</span>
          <span>{formatTimeOfDay(new Date(lastEnd))}</span>
        </div>
      )}
    </div>
  )
}
