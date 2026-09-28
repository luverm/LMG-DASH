import type { SealedBox } from '@/lib/crypto'
import type { KeyValueStorage } from '@/lib/storage/types'

export type Connection =
  | { mode: 'local' }
  | {
      mode: 'github'
      owner: string
      repo: string
      login: string
      sealedToken: SealedBox
      tokenExpiresAt?: string
    }

interface Unlocked {
  token: string
  lastActive: number
}

const CONNECTION_KEY = 'lmg-dash:v1:connection'
const UNLOCKED_KEY = 'lmg-dash:v1:unlocked'
export const AUTO_LOCK_MS = 8 * 60 * 60 * 1000

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

const local = (): KeyValueStorage | null => safe(() => window.localStorage, null)
const session = (): KeyValueStorage | null => safe(() => window.sessionStorage, null)

export function loadConnection(): Connection | null {
  return safe(() => JSON.parse(local()?.getItem(CONNECTION_KEY) ?? 'null') as Connection, null)
}

export function saveConnection(c: Connection) {
  local()?.setItem(CONNECTION_KEY, JSON.stringify(c))
}

export function clearConnection() {
  local()?.removeItem(CONNECTION_KEY)
  session()?.removeItem(UNLOCKED_KEY)
}

/** The decrypted token, kept only for this browser session and dropped after 8h idle. */
export function loadUnlockedToken(now = Date.now()): string | null {
  const u = safe(() => JSON.parse(session()?.getItem(UNLOCKED_KEY) ?? 'null') as Unlocked, null)
  if (!u || now - u.lastActive > AUTO_LOCK_MS) {
    session()?.removeItem(UNLOCKED_KEY)
    return null
  }
  return u.token
}

export function saveUnlockedToken(token: string, now = Date.now()) {
  session()?.setItem(UNLOCKED_KEY, JSON.stringify({ token, lastActive: now } satisfies Unlocked))
}

export function touchUnlocked(now = Date.now()) {
  const token = loadUnlockedToken(now)
  if (token) saveUnlockedToken(token, now)
}

export function lockSession() {
  session()?.removeItem(UNLOCKED_KEY)
}

export function daysUntil(iso: string | undefined, now = Date.now()): number | null {
  if (!iso) return null
  return Math.floor((new Date(iso).getTime() - now) / 86_400_000)
}

/** Removes the local cache of synced documents (used when forgetting a GitHub connection). */
export function clearCachedDocs(prefix = 'lmg-dash:v1:cache:') {
  const storage = safe(() => window.localStorage, null)
  if (!storage) return
  for (const key of Object.keys(storage)) if (key.startsWith(prefix)) storage.removeItem(key)
}
