import { useState } from 'react'
import { parseTime, shiftTime } from '@/lib/timeInput'

interface TimeFieldProps {
  value: string // "HH:MM"
  onChange(value: string): void
  className?: string
  'aria-label'?: string
  required?: boolean
}

/**
 * A 24-hour time field. The browser's own time input follows its language (AM/PM in English),
 * so this is a text field that understands "930", "9:30" or "0930". Arrow keys move 5 minutes.
 */
export function TimeField({ value, onChange, className, required, ...aria }: TimeFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const invalid = draft !== null && draft.trim() !== '' && parseTime(draft) === null

  function commit() {
    if (draft === null) return
    const parsed = parseTime(draft)
    if (parsed && parsed !== value) onChange(parsed)
    setDraft(null)
  }

  return (
    <input
      {...aria}
      className={className ?? 'input'}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="HH:MM"
      maxLength={5}
      required={required}
      aria-invalid={invalid || undefined}
      value={draft ?? value}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const text = e.target.value.replace(/[^\d:.,h]/g, '')
        setDraft(text)
        // Apply as soon as it's a complete time, so the rest of the form updates while typing.
        const parsed = /^\d{4}$|^\d{1,2}[:.,h]\d{2}$/.test(text) ? parseTime(text) : null
        if (parsed) onChange(parsed)
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault()
          const base = parseTime(draft ?? value) ?? value
          if (!base) return
          const next = shiftTime(base, e.key === 'ArrowUp' ? 5 : -5)
          setDraft(null)
          onChange(next)
        } else if (e.key === 'Escape') {
          setDraft(null)
        }
      }}
    />
  )
}
