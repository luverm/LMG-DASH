import { useLayoutEffect, useRef, useState } from 'react'

interface EditableTextProps {
  label: string
  value: string | undefined
  onSave(value: string): void
  multiline?: boolean
  rows?: number
  placeholder?: string
  className?: string
  hideLabel?: boolean
  /** One logical line that wraps and grows instead of scrolling sideways (e.g. titles). */
  wrap?: boolean
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
  wrap,
}: EditableTextProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const area = useRef<HTMLTextAreaElement>(null)
  const shown = draft ?? value

  // Grow the wrapping textarea to fit its text.
  useLayoutEffect(() => {
    const el = area.current
    if (!wrap || !el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [wrap, shown])
  const commit = () => {
    if (draft !== null && draft !== value) onSave(draft)
    setDraft(null)
  }
  const common = {
    className: className ?? 'input',
    value: shown,
    placeholder,
    'aria-label': hideLabel ? label : undefined,
    onFocus: () => setDraft(value),
    onBlur: commit,
  }
  const control = wrap ? (
    <textarea
      {...common}
      ref={area}
      rows={1}
      onChange={(e) => setDraft(e.target.value.replace(/\n/g, ' '))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        }
        if (e.key === 'Escape') {
          setDraft(null)
          e.currentTarget.blur()
        }
      }}
    />
  ) : multiline ? (
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
