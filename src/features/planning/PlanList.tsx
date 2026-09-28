import { useState, type FormEvent } from 'react'
import { ShapeButton } from '@/components/ui/ShapeButton'
import {
  addPlanItem,
  movePlanItem,
  planItemSpentMs,
  removePlanItem,
  setPlanItemDone,
  startPlanItem,
  updatePlanItem,
} from '@/features/workday/day'
import type { DayRecord } from '@/features/workday/types'
import { useWorkday } from '@/features/workday/WorkdayContext'
import { formatMinutes } from '@/lib/time'
import { estimateOptions } from './estimates'
import { PlanItemRow } from './PlanItemRow'
import styles from './Plan.module.css'

interface PlanListProps {
  day: DayRecord
  now: Date
  mode: 'planning' | 'day'
  projectName?: (id?: string) => string | undefined
}

export function PlanList({ day, now, mode, projectName = () => undefined }: PlanListProps) {
  const { update } = useWorkday()
  const [title, setTitle] = useState('')
  const [estimate, setEstimate] = useState<number | undefined>()
  const [dragId, setDragId] = useState<string | null>(null)

  const items = day.plan.filter((i) => i.status !== 'dropped')

  function add(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    update((d) => addPlanItem(d, { title, estimateMinutes: estimate }))
    setTitle('')
    setEstimate(undefined)
  }

  return (
    <div>
      {items.length > 0 && (
        <ul className={styles.list}>
          {items.map((item) => (
            <PlanItemRow
              key={item.id}
              item={item}
              mode={mode}
              spentMs={planItemSpentMs(day, item.id, now)}
              isCurrent={day.focus?.planItemId === item.id && day.segments.some((s) => !s.end)}
              projectName={projectName(item.projectId)}
              onToggleDone={(done) => update((d, t) => setPlanItemDone(d, t, item.id, done))}
              onStart={() => update((d, t) => startPlanItem(d, t, item.id))}
              onRename={(t) => update((d) => updatePlanItem(d, item.id, { title: t }))}
              onEstimate={(m) => update((d) => updatePlanItem(d, item.id, { estimateMinutes: m }))}
              onMove={(delta) =>
                update((d) =>
                  movePlanItem(d, item.id, d.plan.findIndex((i) => i.id === item.id) + delta),
                )
              }
              onRemove={() => update((d) => removePlanItem(d, item.id))}
              dragging={dragId === item.id}
              readOnly={day.status === 'closed'}
              dragHandlers={{
                onDragStart: (e) => {
                  setDragId(item.id)
                  e.dataTransfer.effectAllowed = 'move'
                },
                onDragOver: (e) => dragId && e.preventDefault(),
                onDrop: (e) => {
                  e.preventDefault()
                  if (dragId && dragId !== item.id) {
                    update((d) =>
                      movePlanItem(
                        d,
                        dragId,
                        d.plan.findIndex((i) => i.id === item.id),
                      ),
                    )
                  }
                  setDragId(null)
                },
                onDragEnd: () => setDragId(null),
              }}
            />
          ))}
        </ul>
      )}
      <form className={styles.add} onSubmit={add}>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={items.length ? 'Add another item…' : 'What do you want to get done today?'}
          aria-label="New plan item"
        />
        <select
          className={`input ${styles.estimateSelect}`}
          value={estimate ?? ''}
          onChange={(e) => setEstimate(e.target.value ? Number(e.target.value) : undefined)}
          aria-label="Estimate"
        >
          <option value="">Estimate</option>
          {estimateOptions.map((m) => (
            <option key={m} value={m}>
              {formatMinutes(m)}
            </option>
          ))}
        </select>
        <ShapeButton shape="hexagon" type="submit" disabled={!title.trim()}>
          Add
        </ShapeButton>
      </form>
    </div>
  )
}
