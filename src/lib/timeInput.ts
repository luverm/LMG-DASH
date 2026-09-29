/**
 * Reads a typed 24-hour time: "9", "930", "0930", "9:30", "9.30", "21h15".
 * Returns "HH:MM", or null when it isn't a valid time.
 */
export function parseTime(text: string): string | null {
  const t = text.trim().replace(/\s+/g, '')
  let h: number
  let m: number
  const sep = t.match(/^(\d{1,2})[:.,h](\d{1,2})$/)
  if (sep) {
    h = Number(sep[1])
    m = Number(sep[2].padEnd(2, '0'))
  } else if (/^\d{1,2}$/.test(t)) {
    h = Number(t)
    m = 0
  } else if (/^\d{3,4}$/.test(t)) {
    h = Number(t.slice(0, -2))
    m = Number(t.slice(-2))
  } else {
    return null
  }
  if (h > 23 || m > 59) return null
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Moves an "HH:MM" time by some minutes, wrapping within the day. */
export function shiftTime(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
