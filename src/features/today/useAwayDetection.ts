import { useEffect, useRef, useState } from 'react'

const CHECK_MS = 30_000

/**
 * Notices long stretches away while the clock runs: a hidden tab, or a computer that went to
 * sleep (timers stop, so the gap between checks jumps). Desktop only: on phones the app is
 * usually in the background while you work, which is expected.
 */
export function useAwayDetection(active: boolean, thresholdMinutes: number) {
  const [away, setAway] = useState<{ from: Date; to: Date } | null>(null)
  const hiddenAt = useRef<number | null>(null)
  const lastTick = useRef(0)

  useEffect(() => {
    const desktop = window.matchMedia?.('(pointer: fine)').matches ?? false
    if (!active || !thresholdMinutes || !desktop) return
    const threshold = thresholdMinutes * 60_000
    lastTick.current = Date.now()

    const check = (from: number) => {
      const now = Date.now()
      if (now - from >= threshold) setAway({ from: new Date(from), to: new Date(now) })
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') hiddenAt.current = Date.now()
      else if (hiddenAt.current) {
        check(hiddenAt.current)
        hiddenAt.current = null
      }
    }
    const id = setInterval(() => {
      const now = Date.now()
      if (now - lastTick.current > CHECK_MS * 4) check(lastTick.current)
      lastTick.current = now
    }, CHECK_MS)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [active, thresholdMinutes])

  return { away, clear: () => setAway(null) }
}
