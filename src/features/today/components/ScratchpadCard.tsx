import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Shape } from '@/components/shapes/Shape'
import styles from './Scratchpad.module.css'

interface ScratchpadCardProps {
  notes?: string
  onSave(notes: string): void
  readOnly?: boolean
}

/** Quick notes during the day; saved as you type and shown when you close the day. */
export function ScratchpadCard({ notes = '', onSave, readOnly }: ScratchpadCardProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const save = useRef(onSave)
  useEffect(() => {
    save.current = onSave
  })

  useEffect(() => () => clearTimeout(timer.current), [])

  function change(text: string) {
    setDraft(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => save.current(text), 800)
  }

  return (
    <Card
      title={
        <>
          <Shape kind="square" size={18} /> Scratchpad
        </>
      }
    >
      <textarea
        className={`input ${styles.pad}`}
        rows={4}
        value={draft ?? notes}
        readOnly={readOnly}
        placeholder="Quick notes, links, things to remember…"
        aria-label="Scratchpad"
        onChange={(e) => change(e.target.value)}
        onBlur={() => {
          if (draft === null) return
          clearTimeout(timer.current)
          save.current(draft)
          setDraft(null)
        }}
      />
    </Card>
  )
}
