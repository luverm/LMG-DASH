import { useEffect, useState } from 'react'
import { useData } from '@/app/data/DataContext'
import { segmentMs } from '@/features/workday/day'
import type { DayRecord } from '@/features/workday/types'
import { useWorkday } from '@/features/workday/WorkdayContext'
import { useNow } from '@/hooks/useNow'

export interface ProjectTime {
  totalMs: number
  byDate: { date: string; ms: number }[]
  loading: boolean
}

function projectMs(day: DayRecord, projectId: string, now: Date) {
  return day.segments
    .filter((s) => s.kind === 'work' && s.projectId === projectId)
    .reduce((sum, s) => sum + segmentMs(s, now), 0)
}

/** Tracked time on a project, loading only the days it was worked on. */
export function useProjectTime(projectId: string, workDates: string[]): ProjectTime {
  const { engine, paths } = useData()
  const { today } = useWorkday()
  const now = useNow(true, 30_000)
  const [past, setPast] = useState<{ key: string; byDate: { date: string; ms: number }[] } | null>(
    null,
  )
  const key = workDates.join(',')

  useEffect(() => {
    let cancelled = false
    const dates = key ? key.split(',') : []
    Promise.all(
      dates.map(async (date) => {
        const day = await engine.load<DayRecord>(paths.day(date))
        return { date, ms: day ? projectMs(day, projectId, new Date()) : 0 }
      }),
    )
      .then((byDate) => !cancelled && setPast({ key, byDate }))
      .catch(() => !cancelled && setPast({ key, byDate: [] }))
    return () => {
      cancelled = true
    }
  }, [engine, paths, projectId, key])

  // Today's time comes from the live record so it updates while working.
  const todayMs = projectMs(today, projectId, now)
  const byDate = (past?.byDate ?? []).filter((d) => d.date !== today.date)
  if (todayMs > 0) byDate.push({ date: today.date, ms: todayMs })
  byDate.sort((a, b) => b.date.localeCompare(a.date))
  return {
    totalMs: byDate.reduce((sum, d) => sum + d.ms, 0),
    byDate: byDate.filter((d) => d.ms > 0),
    loading: past?.key !== key,
  }
}
