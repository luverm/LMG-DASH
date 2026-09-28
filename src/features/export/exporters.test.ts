import { dataPaths } from '@/app/data/paths'
import { LocalStore } from '@/lib/storage/localStore'
import { SyncEngine } from '@/lib/storage/syncEngine'
import { memoryStorage } from '@/lib/storage/types'
import { addPlanItem, closeDay, newDay, pause, setFocus, startWork } from '@/features/workday/day'
import { defaultSettings, type DayRecord } from '@/features/workday/types'
import { createBackup, parseBackup, restoreBackup, toCSV, toMarkdown } from './exporters'

const at = (hhmm: string) => new Date(`2026-09-28T${hhmm}:00`)

function sampleDay(): DayRecord {
  let day = newDay('2026-09-28', defaultSettings)
  day = addPlanItem(day, { title: 'Invoice export', projectId: 'p1' })
  day = startWork(day, at('09:00'))
  day = setFocus(day, at('09:00'), { label: 'Emails, "urgent"' })
  day = pause(day, at('09:45'))
  return closeDay(day, at('17:00'), { done: '• Emails', next: 'Invoice export' }, {})
}

describe('exporters', () => {
  it('writes a CSV row per block, quoting where needed', () => {
    const csv = toCSV([sampleDay()], () => undefined)
    expect(csv.split('\n')[0]).toBe('date,start,end,kind,what,project,minutes')
    expect(csv).toContain('2026-09-28,09:00,09:45,work,"Emails, ""urgent""",,45')
  })

  it('writes a Markdown report with the summary', () => {
    const md = toMarkdown([sampleDay()], () => undefined)
    expect(md).toContain('## 2026-09-28')
    expect(md).toContain('Worked 45m')
    expect(md).toContain('**Next up**')
  })

  it('backs up and restores everything by merging', async () => {
    const paths = dataPaths('me')
    const source = new SyncEngine(new LocalStore(memoryStorage()), { debounceMs: 0 })
    source.set(paths.day('2026-09-28'), sampleDay())
    source.set(paths.settings, { ...defaultSettings, targetMinutes: 360 })
    await source.flush()

    const backup = parseBackup(JSON.stringify(await createBackup(source, paths)))
    expect(backup.days).toHaveLength(1)

    const target = new SyncEngine(new LocalStore(memoryStorage()), { debounceMs: 0 })
    await restoreBackup(target, paths, backup)
    const restored = await target.load<DayRecord>(paths.day('2026-09-28'))
    expect(restored?.summary?.next).toBe('Invoice export')
    expect(() => parseBackup('{"hello":1}')).toThrow(/isn't an LMG Dash backup/)
  })
})
