import { useEffect, useRef } from 'react'

/** True when a key press is meant for a text field, menu or dialog rather than a shortcut. */
function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (!t) return false
  if (t.isContentEditable) return true
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return true
  return !!t.closest('[role="dialog"], [role="menu"]')
}

/**
 * Single-key shortcuts (no modifiers), ignored while typing or inside dialogs.
 * Keys are matched on `event.key`, e.g. ' ', 'b', '?'.
 */
export function useShortcuts(map: Record<string, (() => void) | undefined>, enabled = true) {
  const latest = useRef(map)
  useEffect(() => {
    latest.current = map
  })
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || isTyping(e)) return
      if (document.querySelector('[role="dialog"]')) return
      const handler =
        latest.current[e.key.length === 1 ? e.key.toLowerCase() : e.key] ?? latest.current[e.key]
      if (handler) {
        e.preventDefault()
        handler()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [enabled])
}
