import { useState, type DragEvent } from 'react'
import { Shape } from '@/components/shapes/Shape'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { ShapeButton } from '@/components/ui/ShapeButton'
import type { Project } from '@/features/projects/types'
import type { PlanItem } from '@/features/workday/types'
import { formatDuration, formatMinutes } from '@/lib/time'
import { estimateOptions } from './estimates'
import styles from './Plan.module.css'

export interface PlanItemRowProps {
  item: PlanItem
  mode: 'planning' | 'day'
  spentMs: number
  isCurrent: boolean
  projectName?: string
  onToggleDone(done: boolean): void
  onStart(): void
  onRename(title: string): void
  onEstimate(minutes: number | undefined): void
  onMove(delta: number): void
  onRemove(): void
  projectOptions: Project[]
  onProject(id: string | undefined): void
  dragHandlers: {
    onDragStart(e: DragEvent): void
    onDragOver(e: DragEvent): void
    onDrop(e: DragEvent): void
    onDragEnd(): void
  }
  dragging: boolean
  /** Hides the start button (e.g. after the day is closed). */
  readOnly?: boolean
}

export function PlanItemRow({
  item,
  mode,
  spentMs,
  isCurrent,
  projectName,
  onToggleDone,
  onStart,
  onRename,
  onEstimate,
  onMove,
  onRemove,
  projectOptions,
  onProject,
  dragHandlers,
  dragging,
  readOnly,
}: PlanItemRowProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const done = item.status === 'done'
  const over = item.estimateMinutes != null && spentMs > item.estimateMinutes * 60_000

  function commitTitle() {
    setEditing(false)
    if (title.trim() && title.trim() !== item.title) onRename(title.trim())
    else setTitle(item.title)
  }

  return (
    <li
      className={[
        styles.row,
        done && styles.done,
        isCurrent && styles.current,
        dragging && styles.dragging,
      ]
        .filter(Boolean)
        .join(' ')}
      draggable={!editing}
      {...dragHandlers}
    >
      <button
        className={`${styles.check} ${done ? styles.checked : ''}`}
        onClick={() => onToggleDone(!done)}
        aria-label={done ? `Mark "${item.title}" as not done` : `Mark "${item.title}" as done`}
        aria-pressed={done}
      >
        <Shape kind="hexagon" size={22} filled={done} />
      </button>

      <div className={styles.main}>
        {editing ? (
          <input
            className="input"
            value={title}
            autoFocus
            aria-label="Item title"
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle()
              if (e.key === 'Escape') {
                setTitle(item.title)
                setEditing(false)
              }
            }}
          />
        ) : (
          <button className={styles.title} onClick={() => setEditing(true)}>
            {item.title}
          </button>
        )}
        <div className={styles.meta}>
          {item.carriedFrom && <span className={styles.tag}>carried over</span>}
          {projectName && (
            <span className={`${styles.tag} ${styles.projectTag}`}>{projectName}</span>
          )}
        </div>
      </div>

      <span className={`${styles.time} tabular ${over ? styles.over : ''}`}>
        {mode === 'day' && spentMs > 0 && `${formatDuration(spentMs)} / `}
        {item.estimateMinutes
          ? formatMinutes(item.estimateMinutes)
          : mode === 'day' && spentMs > 0
            ? '–'
            : ''}
      </span>

      {mode === 'day' &&
        !readOnly &&
        !done &&
        (isCurrent ? (
          <span className={styles.now}>Now</span>
        ) : (
          <ShapeButton
            shape="circle"
            size="sm"
            variant="ghost"
            onClick={onStart}
            aria-label={`Start "${item.title}"`}
            title="Work on this"
          >
            ▶
          </ShapeButton>
        ))}

      <Menu
        align="right"
        title={item.title}
        trigger={({ toggle }) => (
          <button className={styles.more} onClick={toggle} aria-label={`More for "${item.title}"`}>
            ⋯
          </button>
        )}
      >
        {(close) => (
          <>
            <div className={styles.menuLabel}>Estimate</div>
            <div className={styles.estimates}>
              {[undefined, ...estimateOptions].map((m) => (
                <button
                  key={m ?? 'none'}
                  className={`${styles.chip} ${item.estimateMinutes === m ? styles.chipActive : ''}`}
                  onClick={() => {
                    onEstimate(m)
                    close()
                  }}
                >
                  {m ? formatMinutes(m) : '–'}
                </button>
              ))}
            </div>
            {projectOptions.length > 0 && (
              <label className={styles.menuProject}>
                <span className={styles.menuLabel}>Project</span>
                <select
                  className="input"
                  value={item.projectId ?? ''}
                  onChange={(e) => {
                    onProject(e.target.value || undefined)
                    close()
                  }}
                >
                  <option value="">No project</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <MenuItem onSelect={() => (close(), setEditing(true))}>Rename</MenuItem>
            <MenuItem onSelect={() => (close(), onMove(-1))}>Move up</MenuItem>
            <MenuItem onSelect={() => (close(), onMove(1))}>Move down</MenuItem>
            <MenuItem onSelect={() => (close(), onRemove())}>
              <span style={{ color: 'var(--rose)' }}>Remove</span>
            </MenuItem>
          </>
        )}
      </Menu>
    </li>
  )
}
