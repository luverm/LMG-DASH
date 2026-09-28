import { useEffect, useState } from 'react'

/** The current time, re-rendering every `intervalMs` while `active`. */
export function useNow(active = true, intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!active) return
    const tick = () => setNow(new Date())
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, intervalMs)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [active, intervalMs])
  return now
}
