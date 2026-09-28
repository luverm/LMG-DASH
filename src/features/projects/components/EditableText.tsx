import { useState } from 'react'

interface EditableTextProps {
  label: string
  value: string | undefined
  onSave(value: string): void
  multiline?: boolean
  rows?: number
  placeholder?: string
  className?: string
  hideLabel?: boolean
}

/** A field that edits locally and saves when you leave it (or press Enter on one line). */
export function EditableText({
  label,
  value = '',
  onSave,
  multiline,
  rows = 4,
  placeholder,
  className,
  hideLabel,
}: EditableTextProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft !== null && draft !== value) onSave(draft)
    setDraft(null)
  }
  const common = {
    className: className ?? 'input',
    value: draft ?? value,
    placeholder,
    'aria-label': hideLabel ? label : undefined,
    onFocus: () => setDraft(value),
    onBlur: commit,
  }
  const control = multiline ? (
    <textarea {...common} rows={rows} onChange={(e) => setDraft(e.target.value)} />
  ) : (
    <input
      {...common}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          setDraft(null)
          e.currentTarget.blur()
        }
      }}
    />
  )
  if (hideLabel) return control
  return (
    <label className="field">
      <span>{label}</span>
      {control}
    </label>
  )
}
