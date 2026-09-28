import { useEffect, useState } from 'react'
import { useData } from '@/app/data/DataContext'
import { Card } from '@/components/ui/Card'
import { Shape } from '@/components/shapes/Shape'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { Timeline } from '@/features/today/components/Timeline'
import { totals } from '@/features/workday/day'
import type { DayRecord } from '@/features/workday/types'
import { useWorkday } from '@/features/workday/WorkdayContext'
import { useNow } from '@/hooks/useNow'
import { dateKey, formatDayLabel, formatDuration, parseDateKey } from '@/lib/time'
import styles from './History.module.css'

const PAGE = 14

function startOfWeek(key: string): string {
  const monday = parseDateKey(key)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return dateKey(monday)
}

export function HistoryPage() {
  const { engine, paths } = useData()
  const { today } = useWorkday()
  const [dates, setDates] = useState<string[] | null>(null)
  const [days, setDays] = useState<Record<string, DayRecord>>({})
  const [shown, setShown] = useState(PAGE)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    engine
      .list(paths.daysDir)
      .then((names) => {
        if (cancelled) return
        const keys = names
          .filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n))
          .map((n) => n.slice(0, 10))
          .sort()
          .reverse()
        setDates(keys)
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      cancelled = true
    }
  }, [engine, paths])

  const visible = (dates ?? []).filter((d) => d !== today.date).slice(0, shown)
  const missing = visible.filter((d) => !days[d]).join(',')
  useEffect(() => {
    if (!missing) return
    let cancelled = false
    Promise.all(missing.split(',').map((d) => engine.load<DayRecord>(paths.day(d))))
      .then((loaded) => {
        if (cancelled) return
        setDays((cur) => {
          const next = { ...cur }
          for (const day of loaded) if (day) next[day.date] = day
          return next
        })
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      cancelled = true
    }
  }, [missing, engine, paths])

  const now = useNow(
    today.segments.some((s) => !s.end),
    30_000,
  )
  const list: DayRecord[] = [
    ...(today.segments.length ? [today] : []),
    ...visible.map((d) => days[d]).filter(Boolean),
  ]
  const week = startOfWeek(today.date)
  const weekMs = list
    .filter((d) => d.date >= week)
    .reduce((sum, d) => sum + totals(d, now).workMs, 0)
  const hasMore = (dates?.filter((d) => d !== today.date).length ?? 0) > shown

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>
          <Shape kind="square" size={26} /> History
        </h1>
        {weekMs > 0 && (
          <span className={styles.week}>
            <Shape kind="circle" size={14} filled /> {formatDuration(weekMs)} this week
          </span>
        )}
      </header>

      {error && <p className={styles.error}>Couldn't load history: {error}</p>}
      {dates && list.length === 0 && (
        <div className={styles.empty}>
          <Shape kind="square" size={40} />
          <p>Your past days will show up here once you've tracked some time.</p>
        </div>
      )}

      {list.map((day) => {
        const { workMs, breakMs } = totals(day, now)
        return (
          <Card
            key={day.date}
            title={formatDayLabel(day.date)}
            actions={
              <span className={styles.meta}>
                <span>
                  <Shape kind="circle" size={12} filled /> {formatDuration(workMs)}
                </span>
                <span>
                  <Shape kind="triangle" size={12} filled /> {formatDuration(breakMs)}
                </span>
                {day.summary?.mood && (
                  <Shape
                    kind={day.summary.mood}
                    size={18}
                    filled
                    title={`Mood: ${day.summary.mood}`}
                  />
                )}
                {day.status !== 'closed' && day.date !== today.date && (
                  <span className={styles.tag}>not closed</span>
                )}
              </span>
            }
          >
            <Timeline day={day} now={now} compact />
            {day.summary ? (
              <div className={styles.summary}>
                {day.summary.done && (
                  <div>
                    <h3>Done</h3>
                    <p>{day.summary.done}</p>
                  </div>
                )}
                {day.summary.next && (
                  <div>
                    <h3>Next up</h3>
                    <p>{day.summary.next}</p>
                  </div>
                )}
                {day.summary.blockers && (
                  <div>
                    <h3>Blockers</h3>
                    <p>{day.summary.blockers}</p>
                  </div>
                )}
              </div>
            ) : (
              day.plan.some((i) => i.status === 'done') && (
                <div className={styles.summary}>
                  <div>
                    <h3>Done</h3>
                    <p>
                      {day.plan
                        .filter((i) => i.status === 'done')
                        .map((i) => `• ${i.title}`)
                        .join('\n')}
                    </p>
                  </div>
                </div>
              )
            )}
          </Card>
        )
      })}

      {hasMore && (
        <div className={styles.more}>
          <ShapeButton shape="square" onClick={() => setShown((n) => n + PAGE)}>
            Show older days
          </ShapeButton>
        </div>
      )}
    </div>
  )
}
