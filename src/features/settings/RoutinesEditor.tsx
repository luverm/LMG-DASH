import { useState, type FormEvent } from 'react'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { estimateOptions } from '@/features/planning/estimates'
import type { Routine } from '@/features/workday/types'
import { createId, formatMinutes } from '@/lib/time'
import styles from './Settings.module.css'

// Monday first; values are Date.getDay() numbers.
const weekdays = [
  { day: 1, label: 'M' },
  { day: 2, label: 'T' },
  { day: 3, label: 'W' },
  { day: 4, label: 'T' },
  { day: 5, label: 'F' },
  { day: 6, label: 'S' },
  { day: 0, label: 'S' },
]
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface RoutinesEditorProps {
  routines: Routine[]
  onChange(routines: Routine[], added?: Routine): void
}

/** Plan items that add themselves on chosen weekdays, like a daily standup. */
export function RoutinesEditor({ routines, onChange }: RoutinesEditorProps) {
  const [title, setTitle] = useState('')
  const [estimate, setEstimate] = useState<number | undefined>(15)

  function add(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const routine: Routine = {
      id: createId(),
      title: title.trim(),
      estimateMinutes: estimate,
      weekdays: [1, 2, 3, 4, 5],
    }
    onChange([...routines, routine], routine)
    setTitle('')
  }

  const update = (id: string, patch: Partial<Routine>) =>
    onChange(routines.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <div className={styles.stack}>
      {routines.length === 0 && (
        <p className={styles.muted}>
          Things you do most days, like a standup or checking the inbox. They're added to your plan
          automatically.
        </p>
      )}
      <ul className={styles.routines}>
        {routines.map((r) => (
          <li key={r.id}>
            <span className={styles.routineTitle}>{r.title}</span>
            <select
              className="input"
              aria-label={`Estimate for ${r.title}`}
              value={r.estimateMinutes ?? ''}
              onChange={(e) =>
                update(r.id, {
                  estimateMinutes: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            >
              <option value="">–</option>
              {estimateOptions.map((m) => (
                <option key={m} value={m}>
                  {formatMinutes(m)}
                </option>
              ))}
            </select>
            <div className={styles.weekdays} role="group" aria-label={`Days for ${r.title}`}>
              {weekdays.map((w) => {
                const on = r.weekdays.includes(w.day)
                return (
                  <button
                    key={w.day}
                    aria-pressed={on}
                    aria-label={dayNames[w.day]}
                    className={on ? styles.dayOn : undefined}
                    onClick={() =>
                      update(r.id, {
                        weekdays: on
                          ? r.weekdays.filter((d) => d !== w.day)
                          : [...r.weekdays, w.day],
                      })
                    }
                  >
                    {w.label}
                  </button>
                )
              })}
            </div>
            <button
              className={styles.remove}
              aria-label={`Remove routine ${r.title}`}
              onClick={() => onChange(routines.filter((x) => x.id !== r.id))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form className={styles.routineForm} onSubmit={add}>
        <input
          className="input"
          placeholder="Standup"
          aria-label="New routine"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="input"
          aria-label="Routine estimate"
          value={estimate ?? ''}
          onChange={(e) => setEstimate(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">–</option>
          {estimateOptions.map((m) => (
            <option key={m} value={m}>
              {formatMinutes(m)}
            </option>
          ))}
        </select>
        <ShapeButton shape="hexagon" type="submit" disabled={!title.trim()}>
          Add routine
        </ShapeButton>
      </form>
    </div>
  )
}
