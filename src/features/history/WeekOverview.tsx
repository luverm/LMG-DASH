import { useEffect, useState } from 'react'
import { useData } from '@/app/data/DataContext'
import { Card } from '@/components/ui/Card'
import { Shape } from '@/components/shapes/Shape'
import { useProjects } from '@/features/projects/ProjectsContext'
import { segmentMs, totals } from '@/features/workday/day'
import type { DayRecord } from '@/features/workday/types'
import { useWorkday } from '@/features/workday/WorkdayContext'
import { dateKey, formatDuration, parseDateKey } from '@/lib/time'
import styles from './WeekOverview.module.css'

function weekStart(key: string): string {
  const monday = parseDateKey(key)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return dateKey(monday)
}

function addDays(key: string, n: number) {
  const d = parseDateKey(key)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

const weekdayShort = (key: string) =>
  parseDateKey(key).toLocaleDateString(undefined, { weekday: 'short' })

function weekLabel(start: string, thisWeek: string) {
  if (start === thisWeek) return 'This week'
  if (start === addDays(thisWeek, -7)) return 'Last week'
  const end = addDays(start, 6)
  const fmt = (k: string) =>
    parseDateKey(k).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  return `${fmt(start)} – ${fmt(end)}`
}

/** Hours per day for one week, time per project and done items. */
export function WeekOverview({ now }: { now: Date }) {
  const { engine, paths } = useData()
  const { today } = useWorkday()
  const { projectName } = useProjects()
  const thisWeek = weekStart(today.date)
  const [start, setStart] = useState(thisWeek)
  const [loaded, setLoaded] = useState<{ start: string; days: DayRecord[] } | null>(null)
  const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i))

  useEffect(() => {
    let cancelled = false
    const keys = Array.from({ length: 7 }, (_, i) => addDays(start, i))
    Promise.all(keys.map((k) => engine.load<DayRecord>(paths.day(k)).catch(() => null))).then(
      (days) => !cancelled && setLoaded({ start, days: days.filter((d): d is DayRecord => !!d) }),
    )
    return () => {
      cancelled = true
    }
  }, [engine, paths, start])

  // Today's record comes from memory so the chart moves while you work.
  const days = (loaded?.start === start ? loaded.days : []).filter((d) => d.date !== today.date)
  if (dates.includes(today.date)) days.push(today)
  const byDate = new Map(days.map((d) => [d.date, d]))

  const perDay = dates.map((date) => {
    const d = byDate.get(date)
    return { date, ms: d ? totals(d, now).workMs : 0, target: d?.targetMinutes }
  })
  const workMs = perDay.reduce((s, d) => s + d.ms, 0)
  const breakMs = days.reduce((s, d) => s + totals(d, now).breakMs, 0)
  const daysWorked = perDay.filter((d) => d.ms > 0).length
  const doneCount = days.reduce((s, d) => s + d.plan.filter((i) => i.status === 'done').length, 0)
  const targetMs =
    (days.find((d) => d.targetMinutes)?.targetMinutes ?? today.targetMinutes) * 60_000
  const scaleMs = Math.max(targetMs, ...perDay.map((d) => d.ms), 60 * 60_000)

  const projectMs = new Map<string, number>()
  for (const d of days) {
    for (const s of d.segments) {
      if (s.kind === 'work' && s.projectId) {
        projectMs.set(s.projectId, (projectMs.get(s.projectId) ?? 0) + segmentMs(s, now))
      }
    }
  }
  const projects = [...projectMs.entries()]
    .map(([id, ms]) => ({ id, name: projectName(id) ?? 'Deleted project', ms }))
    .sort((a, b) => b.ms - a.ms)
  const maxProject = projects[0]?.ms ?? 1

  return (
    <Card
      title={
        <>
          <Shape kind="circle" size={18} /> {weekLabel(start, thisWeek)}
        </>
      }
      actions={
        <div className={styles.nav}>
          <button onClick={() => setStart(addDays(start, -7))} aria-label="Previous week">
            ‹
          </button>
          <button
            onClick={() => setStart(addDays(start, 7))}
            disabled={start >= thisWeek}
            aria-label="Next week"
          >
            ›
          </button>
        </div>
      }
    >
      <div className={styles.stats}>
        <div>
          <span className={styles.statValue}>{formatDuration(workMs)}</span>
          <span className={styles.statLabel}>worked</span>
        </div>
        <div>
          <span className={styles.statValue}>{formatDuration(breakMs)}</span>
          <span className={styles.statLabel}>breaks</span>
        </div>
        <div>
          <span className={styles.statValue}>{daysWorked}</span>
          <span className={styles.statLabel}>{daysWorked === 1 ? 'day' : 'days'}</span>
        </div>
        <div>
          <span className={styles.statValue}>{doneCount}</span>
          <span className={styles.statLabel}>done</span>
        </div>
      </div>

      <div className={styles.chart} role="img" aria-label="Hours worked per day">
        <div
          className={styles.target}
          style={{ bottom: `${(targetMs / scaleMs) * 100}%` }}
          aria-hidden
        >
          <span>{formatDuration(targetMs)}</span>
        </div>
        {perDay.map((d) => (
          <div
            key={d.date}
            className={`${styles.col} ${d.date === today.date ? styles.today : ''}`}
            tabIndex={0}
            aria-label={`${weekdayShort(d.date)}: ${formatDuration(d.ms)}`}
          >
            <div className={styles.slot}>
              {d.ms > 0 && (
                <div className={styles.bar} style={{ height: `${(d.ms / scaleMs) * 100}%` }} />
              )}
              <span className={styles.tip}>{formatDuration(d.ms)}</span>
            </div>
            <span className={styles.day}>{weekdayShort(d.date)}</span>
          </div>
        ))}
      </div>

      {projects.length > 0 && (
        <div className={styles.projects}>
          <h3>
            <Shape kind="hexagon" size={14} color="var(--butter)" /> Time per project
          </h3>
          <ul>
            {projects.map((p) => (
              <li key={p.id}>
                <span className={styles.projectName}>{p.name}</span>
                <span className={styles.track}>
                  <span style={{ width: `${(p.ms / maxProject) * 100}%` }} />
                </span>
                <span className={styles.projectValue}>{formatDuration(p.ms)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <table className="visually-hidden">
        <caption>Hours worked per day</caption>
        <tbody>
          {perDay.map((d) => (
            <tr key={d.date}>
              <th scope="row">{d.date}</th>
              <td>{formatDuration(d.ms)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
