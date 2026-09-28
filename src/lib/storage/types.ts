/** A JSON document plus the remote version it was read at (a git blob sha for GitHub). */
export interface StoredDoc<T> {
  data: T
  version: string
}

export interface DocStore {
  /** Returns null when the file doesn't exist. */
  read<T>(path: string): Promise<StoredDoc<T> | null>
  /**
   * Writes a file. `version` must be the version last read, or null when creating a new file.
   * Throws ConflictError when the remote changed in the meantime.
   */
  write<T>(path: string, data: T, version: string | null, message: string): Promise<string>
  /** Lists file names (not paths) directly inside a directory; [] when it doesn't exist. */
  list(dir: string): Promise<string[]>
}

export class ConflictError extends Error {
  constructor(path: string) {
    super(`Remote file changed: ${path}`)
    this.name = 'ConflictError'
  }
}

export class AuthError extends Error {
  constructor(message = 'GitHub rejected the token') {
    super(message)
    this.name = 'AuthError'
  }
}

/** Minimal Storage subset, so tests can pass a Map-backed fake. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function memoryStorage(): KeyValueStorage & { keys(): string[] } {
  const map = new Map<string, string>()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    keys: () => [...map.keys()],
  }
}
