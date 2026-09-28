import { useState } from 'react'
import { Shape } from '@/components/shapes/Shape'
import type { FocusRef } from '@/features/workday/types'
import styles from './FocusInput.module.css'

interface FocusInputProps {
  focus?: FocusRef
  projectName?: string
  onChange(focus: FocusRef | undefined): void
}

/** "Working on: …" line. Click to type a free-text focus. */
export function FocusInput({ focus, projectName, onChange }: FocusInputProps) {
  const [draft, setDraft] = useState<string | null>(null)

  function commit() {
    if (draft === null) return
    const label = draft.trim()
    if (label !== (focus?.label ?? '')) onChange(label ? { label } : undefined)
    setDraft(null)
  }

  return (
    <div className={styles.focus}>
      <Shape kind="hexagon" size={18} filled={!!focus?.planItemId} />
      {draft !== null ? (
        <input
          className={styles.input}
          value={draft}
          autoFocus
          placeholder="What are you working on?"
          aria-label="Current focus"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setDraft(null)
          }}
        />
      ) : (
        <button className={styles.label} onClick={() => setDraft(focus?.label ?? '')}>
          {focus ? (
            <>
              <span className={styles.muted}>Working on</span> {focus.label}
              {projectName && <span className={styles.project}>{projectName}</span>}
            </>
          ) : (
            <span className={styles.muted}>What are you working on?</span>
          )}
        </button>
      )}
    </div>
  )
}
