import { ConflictError, type DocStore, type KeyValueStorage, type StoredDoc } from './types'

/** Stores documents in browser storage. Used for "this browser only" mode and in tests. */
export class LocalStore implements DocStore {
  private readonly storage: KeyValueStorage
  private readonly prefix: string

  constructor(storage: KeyValueStorage, prefix = 'lmg-dash:v1:local:') {
    this.storage = storage
    this.prefix = prefix
  }

  private get index(): string[] {
    return JSON.parse(this.storage.getItem(`${this.prefix}__index`) ?? '[]') as string[]
  }

  async read<T>(path: string): Promise<StoredDoc<T> | null> {
    const raw = this.storage.getItem(this.prefix + path)
    return raw ? (JSON.parse(raw) as StoredDoc<T>) : null
  }

  async write<T>(path: string, data: T, version: string | null, _message?: string) {
    const current = await this.read<T>(path)
    if ((current?.version ?? null) !== version) throw new ConflictError(path)
    const next = String(Number(current?.version ?? 0) + 1)
    this.storage.setItem(this.prefix + path, JSON.stringify({ data, version: next }))
    if (!current) {
      this.storage.setItem(`${this.prefix}__index`, JSON.stringify([...this.index, path]))
    }
    return next
  }

  async list(dir: string): Promise<string[]> {
    const prefix = dir.endsWith('/') ? dir : `${dir}/`
    return this.index
      .filter((p) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
      .map((p) => p.slice(prefix.length))
  }
}
