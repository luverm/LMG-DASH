import { AuthError, ConflictError, type DocStore, type KeyValueStorage } from './types'

export type SyncStatus = 'saved' | 'saving' | 'offline' | 'error'

/** Combines our unsaved local copy with the newer remote copy after a conflict. */
export type MergeFn<T> = (local: T, remote: T) => T

interface DocEntry {
  data: unknown
  /** Remote version the local data is based on; null when the file doesn't exist remotely yet. */
  version: string | null
  dirty: boolean
  merge?: MergeFn<unknown>
}

interface CachedEntry {
  data: unknown
  version: string | null
  dirty: boolean
}

export interface SyncEngineOptions {
  /** Local cache for instant start-up and offline edits; omit to disable. */
  cache?: KeyValueStorage
  cachePrefix?: string
  debounceMs?: number
  retryMs?: number
  /** Commit message for a batch of saved paths. */
  message?: (paths: string[]) => string
}

const isNetworkError = (e: unknown) => e instanceof TypeError

/**
 * Keeps documents in memory, applies changes instantly and writes them to the
 * DocStore in the background (debounced). Unsaved changes survive reloads via
 * the cache, and conflicts are resolved with a per-document merge function.
 */
export class SyncEngine {
  private readonly docs = new Map<string, DocEntry>()
  private readonly listeners = new Set<() => void>()
  private readonly store: DocStore
  private readonly opts: Required<Omit<SyncEngineOptions, 'cache'>> & { cache?: KeyValueStorage }
  private timer: ReturnType<typeof setTimeout> | undefined
  private flushing: Promise<void> | null = null
  private _status: SyncStatus = 'saved'
  private _error: string | null = null

  constructor(store: DocStore, options: SyncEngineOptions = {}) {
    this.store = store
    this.opts = {
      cachePrefix: 'lmg-dash:v1:cache:',
      debounceMs: 3000,
      retryMs: 15000,
      message: (paths) => `Update ${paths.join(', ')}`,
      ...options,
    }
  }

  get status() {
    return this._status
  }

  get error() {
    return this._error
  }

  get hasUnsaved() {
    return [...this.docs.values()].some((d) => d.dirty)
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => void this.listeners.delete(listener)
  }

  private setStatus(status: SyncStatus, error: string | null = null) {
    this._status = status
    this._error = error
    this.listeners.forEach((l) => l())
  }

  private readCache(path: string): CachedEntry | null {
    const raw = this.opts.cache?.getItem(this.opts.cachePrefix + path)
    return raw ? (JSON.parse(raw) as CachedEntry) : null
  }

  private writeCache(path: string, entry: DocEntry) {
    const cached: CachedEntry = { data: entry.data, version: entry.version, dirty: entry.dirty }
    this.opts.cache?.setItem(this.opts.cachePrefix + path, JSON.stringify(cached))
  }

  /** Returns the cached copy without touching the network (for instant first paint). */
  peek<T>(path: string): T | null {
    const mem = this.docs.get(path)
    if (mem) return mem.data as T
    return (this.readCache(path)?.data as T | undefined) ?? null
  }

  /** Loads a document. Unsaved local changes win and are merged/pushed later. */
  async load<T>(path: string, options: { merge?: MergeFn<T> } = {}): Promise<T | null> {
    const existing = this.docs.get(path)
    if (existing) {
      if (options.merge) existing.merge = options.merge as MergeFn<unknown>
      return existing.data as T
    }
    const cached = this.readCache(path)
    let entry: DocEntry
    try {
      const remote = await this.store.read<T>(path)
      if (cached?.dirty) {
        // Keep local edits; the flush merges if the remote moved on.
        entry = { data: cached.data, version: cached.version, dirty: true }
      } else {
        entry = { data: remote?.data ?? null, version: remote?.version ?? null, dirty: false }
      }
    } catch (e) {
      if (!isNetworkError(e) || !cached) throw e
      this.setStatus('offline')
      entry = { data: cached.data, version: cached.version, dirty: cached.dirty }
    }
    entry.merge = options.merge as MergeFn<unknown> | undefined
    // Another load may have finished first; keep the first entry.
    const raced = this.docs.get(path)
    if (raced) return raced.data as T
    this.docs.set(path, entry)
    if (entry.data !== null) this.writeCache(path, entry)
    if (entry.dirty) this.schedule()
    return entry.data as T | null
  }

  /** Replaces a document locally and schedules a save. */
  set<T>(path: string, data: T, options: { merge?: MergeFn<T>; immediate?: boolean } = {}) {
    const entry = this.docs.get(path) ?? { data: null, version: null, dirty: false }
    entry.data = data
    entry.dirty = true
    if (options.merge) entry.merge = options.merge as MergeFn<unknown>
    this.docs.set(path, entry)
    this.writeCache(path, entry)
    if (this._status !== 'offline') this.setStatus('saving')
    if (options.immediate) void this.flush()
    else this.schedule()
  }

  async list(dir: string): Promise<string[]> {
    const remote = await this.store.list(dir)
    const prefix = dir.endsWith('/') ? dir : `${dir}/`
    const local = [...this.docs.keys()]
      .filter((p) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
      .map((p) => p.slice(prefix.length))
    return [...new Set([...remote, ...local])]
  }

  private schedule(delay = this.opts.debounceMs) {
    clearTimeout(this.timer)
    this.timer = setTimeout(() => void this.flush(), delay)
  }

  /** Saves all dirty documents now. Safe to call repeatedly. */
  flush(): Promise<void> {
    clearTimeout(this.timer)
    if (this.flushing) return this.flushing.then(() => (this.hasUnsaved ? this.flush() : undefined))
    this.flushing = this.doFlush().finally(() => (this.flushing = null))
    return this.flushing
  }

  private async doFlush() {
    const dirty = [...this.docs.entries()].filter(([, e]) => e.dirty)
    if (dirty.length === 0) {
      if (this._status !== 'saved') this.setStatus('saved')
      return
    }
    this.setStatus('saving')
    const message = this.opts.message(dirty.map(([p]) => p))
    try {
      for (const [path, entry] of dirty) await this.save(path, entry, message)
      this.setStatus(this.hasUnsaved ? 'saving' : 'saved')
      if (this.hasUnsaved) this.schedule()
    } catch (e) {
      if (isNetworkError(e)) {
        this.setStatus('offline')
      } else {
        this.setStatus('error', e instanceof Error ? e.message : String(e))
      }
      if (!(e instanceof AuthError)) this.schedule(this.opts.retryMs)
    }
  }

  private async save(path: string, entry: DocEntry, message: string) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const snapshot = entry.data
      try {
        const version = await this.store.write(path, snapshot, entry.version, message)
        entry.version = version
        // Only clean if nothing changed while the request was in flight.
        if (entry.data === snapshot) entry.dirty = false
        this.writeCache(path, entry)
        return
      } catch (e) {
        if (!(e instanceof ConflictError)) throw e
        const remote = await this.store.read(path)
        entry.version = remote?.version ?? null
        if (remote && entry.merge) entry.data = entry.merge(entry.data, remote.data)
      }
    }
    throw new Error(`Couldn't save ${path}: it keeps changing elsewhere`)
  }

  /** Clears the in-memory state and local cache (used when disconnecting). */
  reset(paths: string[] = [...this.docs.keys()]) {
    clearTimeout(this.timer)
    for (const p of paths) {
      this.docs.delete(p)
      this.opts.cache?.removeItem(this.opts.cachePrefix + p)
    }
  }
}
