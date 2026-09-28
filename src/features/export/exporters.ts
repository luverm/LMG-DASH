import type { SyncEngine } from '@/lib/storage/syncEngine'
import type { DataPaths } from '@/app/data/paths'
import { mergeProjects } from '@/features/projects/projects'
import { emptyProjectsFile, type ProjectsFile } from '@/features/projects/types'
import { segmentMs, totals } from '@/features/workday/day'
import { mergeDay, mergeSettings } from '@/features/workday/merge'
import { breakLabel, withDefaults, type DayRecord, type Settings } from '@/features/workday/types'
import { formatDuration, formatTimeOfDay } from '@/lib/time'

export interface Backup {
  app: 'lmg-dash'
  version: 1
  exportedAt: string
  settings: Settings
  projects: ProjectsFile
  days: DayRecord[]
}

export async function loadAllDays(engine: SyncEngine, paths: DataPaths): Promise<DayRecord[]> {
  const names = await engine.list(paths.daysDir)
  const keys = names.filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n)).map((n) => n.slice(0, 10))
  const days = await Promise.all(keys.map((k) => engine.load<DayRecord>(paths.day(k))))
  return days.filter((d): d is DayRecord => !!d).sort((a, b) => a.date.localeCompare(b.date))
}

export async function createBackup(engine: SyncEngine, paths: DataPaths): Promise<Backup> {
  const [days, projects, settings] = await Promise.all([
    loadAllDays(engine, paths),
    engine.load<ProjectsFile>(paths.projects),
    engine.load<Settings>(paths.settings),
  ])
  return {
    app: 'lmg-dash',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: withDefaults(settings),
    projects: projects ?? emptyProjectsFile,
    days,
  }
}

export function parseBackup(text: string): Backup {
  const data = JSON.parse(text) as Partial<Backup>
  if (data.app !== 'lmg-dash' || data.version !== 1 || !Array.isArray(data.days)) {
    throw new Error("This file isn't an LMG Dash backup.")
  }
  return data as Backup
}

/** Restores a backup by merging it into what's there: nothing already tracked is lost. */
export async function restoreBackup(engine: SyncEngine, paths: DataPaths, backup: Backup) {
  for (const day of backup.days) {
    const path = paths.day(day.date)
    const current = await engine.load<DayRecord>(path, { merge: mergeDay })
    engine.set(path, current ? mergeDay(current, day) : day, { merge: mergeDay })
  }
  const projects = await engine.load<ProjectsFile>(paths.projects, { merge: mergeProjects })
  engine.set(
    paths.projects,
    projects ? mergeProjects(projects, backup.projects) : backup.projects,
    {
      merge: mergeProjects,
    },
  )
  const settings = await engine.load<Settings>(paths.settings, { merge: mergeSettings })
  engine.set(
    paths.settings,
    settings
      ? mergeSettings(settings, withDefaults(backup.settings))
      : withDefaults(backup.settings),
    {
      merge: mergeSettings,
    },
  )
  await engine.flush()
}

type ProjectName = (id?: string) => string | undefined

/** A readable report: one section per day with totals, summary and notes. */
export function toMarkdown(days: DayRecord[], projectName: ProjectName, now = new Date()): string {
  const out: string[] = ['# LMG Dash report', '']
  const all = days.reduce((s, d) => s + totals(d, now).workMs, 0)
  if (days.length) {
    out.push(`${days[0].date} to ${days.at(-1)!.date} · ${formatDuration(all)} worked`, '')
  }
  for (const d of days) {
    const { workMs, breakMs } = totals(d, now)
    out.push(
      `## ${d.date}`,
      '',
      `Worked ${formatDuration(workMs)} · breaks ${formatDuration(breakMs)}`,
      '',
    )
    const done = d.plan.filter((i) => i.status === 'done')
    if (d.summary?.done) out.push('**Done**', '', d.summary.done, '')
    else if (done.length) {
      out.push(
        '**Done**',
        '',
        ...done.map((i) => {
          const p = projectName(i.projectId)
          return `- ${i.title}${p ? ` (${p})` : ''}`
        }),
        '',
      )
    }
    if (d.summary?.next) out.push('**Next up**', '', d.summary.next, '')
    if (d.summary?.blockers) out.push('**Blockers**', '', d.summary.blockers, '')
    if (d.notes) out.push('**Notes**', '', d.notes, '')
  }
  return out.join('\n')
}

const csvCell = (v: string | number) => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** One row per work or break block, for spreadsheets. */
export function toCSV(days: DayRecord[], projectName: ProjectName, now = new Date()): string {
  const rows = [['date', 'start', 'end', 'kind', 'what', 'project', 'minutes']]
  for (const d of days) {
    for (const s of [...d.segments].sort((a, b) => a.start.localeCompare(b.start))) {
      rows.push([
        d.date,
        formatTimeOfDay(new Date(s.start)),
        s.end ? formatTimeOfDay(new Date(s.end)) : '',
        s.kind,
        s.kind === 'work' ? (s.focus ?? '') : breakLabel(s.breakType),
        projectName(s.projectId) ?? '',
        String(Math.round(segmentMs(s, now) / 60_000)),
      ])
    }
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n'
}

export function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
