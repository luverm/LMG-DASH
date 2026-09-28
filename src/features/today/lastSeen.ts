const KEY = 'lmg-dash:v1:lastSeen'

/** Per-device "still here while working" timestamp, used to guess when a forgotten clock stopped. */
export function saveLastSeen(d = new Date()) {
  try {
    localStorage.setItem(KEY, d.toISOString())
  } catch {
    // storage unavailable
  }
}

export function loadLastSeen(): Date | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? new Date(raw) : null
  } catch {
    return null
  }
}
