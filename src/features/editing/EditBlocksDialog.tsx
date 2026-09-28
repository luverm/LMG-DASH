import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { ShapeButton } from '@/components/ui/ShapeButton'
import {
  breakLabel,
  breakTypes,
  type BreakType,
  type DayRecord,
  type Segment,
} from '@/features/workday/types'
import { atTime, createId, formatDayLabel, formatDuration, formatTimeOfDay } from '@/lib/time'
import { toDraft, validateDrafts, type Draft } from './drafts'
import styles from './EditBlocks.module.css'

interface EditBlocksDialogProps {
  day: DayRecord
  onSave(segments: Segment[]): void
  onClose(): void
}

/** Fix start and end times, change a block's type or label, delete or add blocks. */
export function EditBlocksDialog({ day, onSave, onClose }: EditBlocksDialogProps) {
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    [...day.segments].sort((a, b) => a.start.localeCompare(b.start)).map(toDraft),
  )
  const [openedAt] = useState(() => Date.now())
  const errors = validateDrafts(day.date, drafts)
  const set = (id: string, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)))

  function addBlock() {
    const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))
    const hhmm = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    const sorted = [...drafts].sort((a, b) => a.start.localeCompare(b.start))
    const last = sorted.at(-1)
    let start: number
    let end: number
    if (last?.running) {
      // Most often a forgotten earlier block: fill the hour before the running one.
      const before = sorted.at(-2)
      end = toMinutes(last.start)
      start = Math.max(end - 60, before?.end ? toMinutes(before.end) : 0)
    } else {
      // Otherwise an hour after the last block, kept within the day.
      const from = last ? toMinutes(last.end || last.start) : 9 * 60
      end = Math.min(from + 60, 23 * 60 + 59)
      start = Math.min(from, end - 30)
    }
    setDrafts((ds) => [
      ...ds,
      {
        id: createId(),
        kind: 'work',
        focus: '',
        start: hhmm(start),
        end: hhmm(end),
        running: false,
      },
    ])
  }

  function save() {
    const segments: Segment[] = drafts.map((d) => ({
      id: d.id,
      kind: d.kind,
      breakType: d.kind === 'break' ? (d.breakType ?? 'other') : undefined,
      focus: d.kind === 'work' ? d.focus.trim() || undefined : undefined,
      planItemId: d.kind === 'work' ? d.planItemId : undefined,
      projectId: d.kind === 'work' ? d.projectId : undefined,
      start: atTime(day.date, d.start).toISOString(),
      end: d.running ? undefined : atTime(day.date, d.end).toISOString(),
    }))
    onSave(segments)
    onClose()
  }

  const valid = Object.keys(errors).length === 0

  return (
    <Dialog
      title={`Edit times · ${formatDayLabel(day.date)}`}
      shape="circle"
      wide
      maxWidth={820}
      onClose={onClose}
      footer={
        <>
          <ShapeButton shape="hexagon" variant="ghost" onClick={addBlock}>
            Add block
          </ShapeButton>
          <span style={{ flex: 1 }} />
          <ShapeButton shape="triangle" variant="ghost" onClick={onClose}>
            Cancel
          </ShapeButton>
          <ShapeButton shape="circle" variant="solid" disabled={!valid} onClick={save}>
            Save
          </ShapeButton>
        </>
      }
    >
      {drafts.length === 0 && <p className={styles.empty}>No blocks yet. Add one below.</p>}
      <ul className={styles.list}>
        {[...drafts]
          .sort((a, b) => a.start.localeCompare(b.start))
          .map((d) => {
            const ms =
              d.start && (d.running || d.end)
                ? (d.running ? openedAt : atTime(day.date, d.end).getTime()) -
                  atTime(day.date, d.start).getTime()
                : 0
            return (
              <li key={d.id} className={`${styles.block} ${styles[d.kind]}`}>
                <div className={styles.kind} role="radiogroup" aria-label="Type">
                  {(['work', 'break'] as const).map((k) => (
                    <button
                      key={k}
                      role="radio"
                      aria-checked={d.kind === k}
                      className={d.kind === k ? styles.kindActive : undefined}
                      onClick={() => set(d.id, { kind: k })}
                    >
                      {k === 'work' ? 'Work' : 'Break'}
                    </button>
                  ))}
                </div>
                <label className={styles.time}>
                  <span>From</span>
                  <input
                    className="input"
                    type="time"
                    value={d.start}
                    onChange={(e) => set(d.id, { start: e.target.value })}
                  />
                </label>
                <label className={styles.time}>
                  <span>To</span>
                  {d.running ? (
                    <button
                      className={styles.running}
                      onClick={() =>
                        set(d.id, { running: false, end: formatTimeOfDay(new Date()) })
                      }
                      title="Stop this block"
                    >
                      running · stop
                    </button>
                  ) : (
                    <input
                      className="input"
                      type="time"
                      value={d.end}
                      onChange={(e) => set(d.id, { end: e.target.value })}
                    />
                  )}
                </label>
                {d.kind === 'work' ? (
                  <input
                    className={`input ${styles.label}`}
                    placeholder="Working on…"
                    aria-label="Working on"
                    value={d.focus}
                    onChange={(e) => set(d.id, { focus: e.target.value })}
                  />
                ) : (
                  <select
                    className={`input ${styles.label}`}
                    aria-label="Break type"
                    value={d.breakType ?? 'other'}
                    onChange={(e) => set(d.id, { breakType: e.target.value as BreakType })}
                  >
                    {breakTypes.map((b) => (
                      <option key={b.type} value={b.type}>
                        {breakLabel(b.type)}
                      </option>
                    ))}
                    {d.breakType && !breakTypes.some((b) => b.type === d.breakType) && (
                      <option value={d.breakType}>{breakLabel(d.breakType)}</option>
                    )}
                  </select>
                )}
                <span className={styles.duration}>{ms > 0 ? formatDuration(ms) : ''}</span>
                <button
                  className={styles.delete}
                  aria-label="Delete block"
                  onClick={() => setDrafts((ds) => ds.filter((x) => x.id !== d.id))}
                >
                  ×
                </button>
                {errors[d.id] && <p className={styles.error}>{errors[d.id]}</p>}
              </li>
            )
          })}
      </ul>
    </Dialog>
  )
}
