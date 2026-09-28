const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parses YYYY-MM-DD as a local date at midnight. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 1:02:03 */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h}:${pad(m)}:${pad(s)}`
}

/** "1h 20m", "45m", "0m" */
export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function formatMinutes(minutes: number): string {
  return formatDuration(minutes * 60_000)
}

/** 09:05 */
export function formatTimeOfDay(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Combines a YYYY-MM-DD key with an "HH:MM" string into a local Date. */
export function atTime(key: string, hhmm: string): Date {
  const d = parseDateKey(key)
  const [h, m] = hhmm.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d
}

export function formatDayLabel(key: string, today = dateKey(new Date())): string {
  if (key === today) return 'Today'
  const d = parseDateKey(key)
  const yesterday = new Date(parseDateKey(today))
  yesterday.setDate(yesterday.getDate() - 1)
  if (key === dateKey(yesterday)) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
