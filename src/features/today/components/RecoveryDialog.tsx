import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { TimeField } from '@/components/ui/TimeField'
import { openSegment } from '@/features/workday/day'
import type { DayRecord } from '@/features/workday/types'
import { atTime, dateKey, formatDayLabel, formatTimeOfDay } from '@/lib/time'
import { loadLastSeen } from '../lastSeen'

interface RecoveryDialogProps {
  day: DayRecord
  onResolve(end: Date): void
}

function defaultStop(day: DayRecord, start: Date): string {
  const lastSeen = loadLastSeen()
  if (lastSeen && lastSeen > start && dateKey(lastSeen) === day.date) {
    return formatTimeOfDay(lastSeen)
  }
  const guess = new Date(
    Math.min(start.getTime() + 60 * 60_000, atTime(day.date, '23:59').getTime()),
  )
  return formatTimeOfDay(guess)
}

/** Asks when a clock that was left running on an earlier day actually stopped. */
export function RecoveryDialog({ day, onResolve }: RecoveryDialogProps) {
  const open = openSegment(day)!
  const start = new Date(open.start)
  const [time, setTime] = useState(() => defaultStop(day, start))
  const invalid = atTime(day.date, time) < start

  return (
    <Dialog
      title="You were still clocked in"
      shape="triangle"
      footer={
        <ShapeButton
          shape="circle"
          variant="solid"
          disabled={invalid}
          onClick={() => onResolve(atTime(day.date, time))}
        >
          Save
        </ShapeButton>
      }
    >
      <p>
        {formatDayLabel(day.date)} the clock ran from {formatTimeOfDay(start)}
        {open.kind === 'break' ? ' (on a break)' : ''} and was never stopped. When did you stop?
      </p>
      <label className="field">
        <span>Stopped at</span>
        <TimeField value={time} onChange={setTime} required />
      </label>
      {invalid && (
        <p style={{ color: 'var(--rose)' }}>That's before it started ({formatTimeOfDay(start)}).</p>
      )}
    </Dialog>
  )
}
