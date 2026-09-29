import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { TimeField } from '@/components/ui/TimeField'
import {
  breakLabel,
  breakTypes,
  type BreakType,
  type DayRecord,
  type Segment,
} from '@/features/workday/types'
import {
  atTime,
  createId,
  dateKey,
  formatDayLabel,
  formatDuration,
  formatTimeOfDay,
} from '@/lib/time'
import { suggestNewBlock, toDraft, validateDrafts, type Draft } from './drafts'
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
  const [added, setAdded] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const errors = validateDrafts(day.date, drafts)
  const set = (id: string, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)))

  function addBlock() {
    const isToday = day.date === dateKey(new Date(openedAt))
    const slot = suggestNewBlock(drafts, isToday ? formatTimeOfDay(new Date(openedAt)) : '23:59')
    if (!slot) {
      setNotice("There's no free time left to add a block. Shorten or delete one first.")
      return
    }
    const id = createId()
    setNotice(null)
    setAdded(id)
    setDrafts((ds) => [...ds, { id, kind: 'work', focus: '', ...slot, running: false }])
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
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
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
              <li
                key={d.id}
                ref={(el) => {
                  if (el && d.id === added)
                    el.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
                }}
                className={[
                  styles.block,
                  styles[d.kind],
                  d.id === added && styles.added,
                  errors[d.id] && styles.invalid,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className={styles.top}>
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
                  <span className={styles.duration}>
                    {d.running ? 'running' : ms > 0 ? formatDuration(ms) : ''}
                  </span>
                  <button
                    className={styles.delete}
                    aria-label="Delete block"
                    onClick={() => setDrafts((ds) => ds.filter((x) => x.id !== d.id))}
                  >
                    ×
                  </button>
                </div>

                <div className={styles.times}>
                  <label className={styles.time}>
                    <span>From</span>
                    <TimeField
                      className={`input ${styles.timeInput}`}
                      aria-label="From"
                      value={d.start}
                      onChange={(start) => set(d.id, { start })}
                    />
                  </label>
                  <span className={styles.arrow} aria-hidden>
                    →
                  </span>
                  <label className={styles.time}>
                    <span>To</span>
                    {d.running ? (
                      <button
                        className={styles.running}
                        onClick={() =>
                          set(d.id, { running: false, end: formatTimeOfDay(new Date()) })
                        }
                        title="Stop this block now"
                      >
                        <span className={styles.pulse} aria-hidden />
                        Now · stop
                      </button>
                    ) : (
                      <TimeField
                        className={`input ${styles.timeInput}`}
                        aria-label="To"
                        value={d.end}
                        onChange={(end) => set(d.id, { end })}
                      />
                    )}
                  </label>
                </div>

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
                {errors[d.id] && <p className={styles.error}>{errors[d.id]}</p>}
              </li>
            )
          })}
      </ul>
    </Dialog>
  )
}
