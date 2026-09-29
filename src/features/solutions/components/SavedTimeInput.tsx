import { useState } from 'react'
import { formatMinutes } from '@/lib/time'
import { savedTime, yearlySavedMinutes } from '../solutions'
import { savedPeriods, type SavedPeriod, type Solution } from '../types'
import styles from '../Solutions.module.css'

interface SavedTimeInputProps {
  solution: Solution
  onChange(patch: Pick<Solution, 'savedMinutes' | 'savedPer' | 'savedMinutesPerWeek'>): void
}

const toHours = (minutes?: number) =>
  minutes == null ? '' : String(Math.round((minutes / 60) * 100) / 100)

/** Hours saved per week, month or year, with the yearly total underneath. */
export function SavedTimeInput({ solution, onChange }: SavedTimeInputProps) {
  const current = savedTime(solution)
  const [draft, setDraft] = useState<string | null>(null)
  const per: SavedPeriod = current?.per ?? 'year'

  function save(hoursText: string, period: SavedPeriod) {
    const hours = Number(hoursText.replace(',', '.'))
    const minutes = hoursText.trim() && hours > 0 ? Math.round(hours * 60) : undefined
    // Clear the old weekly-only field once the new fields are used.
    onChange({
      savedMinutes: minutes,
      savedPer: minutes ? period : undefined,
      savedMinutesPerWeek: undefined,
    })
  }

  const yearly = yearlySavedMinutes(solution)

  return (
    <div className="field">
      <span>Time saved (roughly)</span>
      <div className={styles.savedRow}>
        <input
          className="input"
          type="text"
          inputMode="decimal"
          placeholder="Hours"
          aria-label="Hours saved"
          value={draft ?? toHours(current?.minutes)}
          onFocus={() => setDraft(toHours(current?.minutes))}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, ''))}
          onBlur={() => {
            if (draft !== null) save(draft, per)
            setDraft(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <span className={styles.savedUnit}>hours</span>
        <select
          className="input"
          aria-label="Per"
          value={per}
          onChange={(e) => save(draft ?? toHours(current?.minutes), e.target.value as SavedPeriod)}
        >
          {savedPeriods.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      {yearly > 0 && per !== 'year' && (
        <span className={styles.savedYear}>≈ {formatMinutes(yearly)} per year</span>
      )}
    </div>
  )
}
