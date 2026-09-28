import { useId, useState } from 'react'
import { parsePeople } from '../projects'

interface PeopleInputProps {
  value: string[]
  people: string[]
  onChange(names: string[]): void
  label?: string
  autoFocus?: boolean
}

/** Comma-separated names with suggestions from people entered before. */
export function PeopleInput({
  value,
  people,
  onChange,
  label = 'From',
  autoFocus,
}: PeopleInputProps) {
  const listId = useId()
  const [text, setText] = useState(value.join(', '))
  // The browser only suggests for the last name being typed.
  const typed = text.split(',')
  const prefix = typed
    .slice(0, -1)
    .map((s) => s.trim())
    .filter(Boolean)
  const suggestions = people
    .filter((p) => !prefix.some((x) => x.toLowerCase() === p.toLowerCase()))
    .map((p) => [...prefix, p].join(', '))

  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="input"
        list={listId}
        value={text}
        autoFocus={autoFocus}
        placeholder="Anna, Bram"
        onChange={(e) => {
          setText(e.target.value)
          onChange(parsePeople(e.target.value))
        }}
        onBlur={() => setText(parsePeople(text).join(', '))}
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </label>
  )
}
