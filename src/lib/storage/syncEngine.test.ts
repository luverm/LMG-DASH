import { LocalStore } from './localStore'
import { SyncEngine } from './syncEngine'
import { memoryStorage, type DocStore } from './types'

interface Doc {
  items: string[]
}
const mergeItems = (a: Doc, b: Doc): Doc => ({ items: [...new Set([...b.items, ...a.items])] })

function setup() {
  const remote = new LocalStore(memoryStorage())
  const cache = memoryStorage()
  const engine = new SyncEngine(remote, { cache, debounceMs: 10_000 })
  return { remote, cache, engine }
}

describe('SyncEngine', () => {
  it('applies changes locally at once and writes them on flush', async () => {
    const { remote, engine } = setup()
    engine.set('a.json', { items: ['x'] })
    expect(engine.peek<Doc>('a.json')).toEqual({ items: ['x'] })
    expect(engine.status).toBe('saving')
    expect(await remote.read('a.json')).toBeNull()

    await engine.flush()
    expect((await remote.read<Doc>('a.json'))?.data).toEqual({ items: ['x'] })
    expect(engine.status).toBe('saved')
  })

  it('merges with a newer remote copy on conflict', async () => {
    const { remote, engine } = setup()
    await remote.write('a.json', { items: ['base'] }, null, '')
    await engine.load<Doc>('a.json', { merge: mergeItems })

    // Another device writes in the meantime.
    await remote.write('a.json', { items: ['base', 'other'] }, '1', '')

    engine.set('a.json', { items: ['base', 'mine'] })
    await engine.flush()
    expect((await remote.read<Doc>('a.json'))?.data.items.sort()).toEqual(['base', 'mine', 'other'])
    expect(engine.peek<Doc>('a.json')?.items.sort()).toEqual(['base', 'mine', 'other'])
  })

  it('keeps unsaved edits across a reload via the cache', async () => {
    const { remote, cache, engine } = setup()
    engine.set('a.json', { items: ['draft'] })

    const reloaded = new SyncEngine(remote, { cache, debounceMs: 10_000 })
    expect(await reloaded.load<Doc>('a.json')).toEqual({ items: ['draft'] })
    await reloaded.flush()
    expect((await remote.read<Doc>('a.json'))?.data).toEqual({ items: ['draft'] })
  })

  it('goes offline on network errors and keeps the change dirty', async () => {
    const failing: DocStore = {
      read: async () => null,
      list: async () => [],
      write: async () => {
        throw new TypeError('Failed to fetch')
      },
    }
    const engine = new SyncEngine(failing, { debounceMs: 10_000, retryMs: 10_000 })
    engine.set('a.json', { items: [] })
    await engine.flush()
    expect(engine.status).toBe('offline')
    expect(engine.hasUnsaved).toBe(true)
    engine.reset()
  })

  it('lists remote files plus unsaved new ones', async () => {
    const { remote, engine } = setup()
    await remote.write('days/2026-01-01.json', { items: [] }, null, '')
    engine.set('days/2026-01-02.json', { items: [] })
    expect((await engine.list('days')).sort()).toEqual(['2026-01-01.json', '2026-01-02.json'])
    engine.reset()
  })
})
