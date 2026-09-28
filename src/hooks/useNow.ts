import { useEffect, useState } from 'react'

/** The current time, re-rendering every `intervalMs` while `active`. */
export function useNow(active = true, intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!active) return
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [active, intervalMs])
  return now
}
