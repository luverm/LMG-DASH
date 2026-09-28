import { plannedMinutes } from '@/features/workday/day'
import type { DayRecord } from '@/features/workday/types'
import { formatMinutes } from '@/lib/time'
import styles from './PlanYourDay.module.css'

/** "5h 30m planned of 8h", in rose with a soft note when over. */
export function PlannedTotal({ day }: { day: DayRecord }) {
  const planned = plannedMinutes(day)
  if (planned === 0) return null
  const over = planned > day.targetMinutes
  return (
    <span className={`${styles.total} ${over ? styles.totalOver : ''}`}>
      {formatMinutes(planned)} planned of {formatMinutes(day.targetMinutes)}
      {over && <span className={styles.note}> · that's a lot for one day</span>}
    </span>
  )
}
