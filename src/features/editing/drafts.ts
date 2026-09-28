import type { BreakType, Segment } from '@/features/workday/types'
import { atTime, formatTimeOfDay } from '@/lib/time'

export interface Draft {
  id: string
  kind: 'work' | 'break'
  breakType?: BreakType
  focus: string
  planItemId?: string
  projectId?: string
  start: string // HH:MM
  end: string // HH:MM, '' while running
  running: boolean
}

export function toDraft(s: Segment): Draft {
  return {
    id: s.id,
    kind: s.kind,
    breakType: s.breakType,
    focus: s.focus ?? '',
    planItemId: s.planItemId,
    projectId: s.projectId,
    start: formatTimeOfDay(new Date(s.start)),
    end: s.end ? formatTimeOfDay(new Date(s.end)) : '',
    running: !s.end,
  }
}

/** Problems that block saving, keyed by draft id. */
export function validateDrafts(date: string, drafts: Draft[]): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const d of drafts) {
    if (!d.start) errors[d.id] = 'Needs a start time'
    else if (!d.running && !d.end) errors[d.id] = 'Needs an end time'
    else if (!d.running && atTime(date, d.end) <= atTime(date, d.start)) {
      errors[d.id] = 'Ends before it starts'
    }
  }
  const sorted = [...drafts]
    .filter((d) => !errors[d.id])
    .sort((a, b) => a.start.localeCompare(b.start))
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    if (prev.running) errors[prev.id] = 'Only the last block can still be running'
    else if (sorted[i].start < prev.end) errors[sorted[i].id] = 'Overlaps the block before it'
  }
  return errors
}

const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))
const toHHMM = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

const MIN_GAP = 15
const NEW_BLOCK = 60

/**
 * Where a new block fits: up to an hour at the end of the latest free gap of at least 15
 * minutes between 00:00 and `dayEndHHMM` (now, for today). Null when the day is full.
 */
export function suggestNewBlock(
  drafts: Draft[],
  dayEndHHMM: string,
): { start: string; end: string } | null {
  const dayEnd = toMinutes(dayEndHHMM)
  const busy = drafts
    .filter((d) => d.start)
    .map((d) => {
      const start = toMinutes(d.start)
      const end = d.running || !d.end ? Math.max(start, dayEnd) : toMinutes(d.end)
      return { start, end }
    })
    .sort((a, b) => a.start - b.start)

  const gaps: { start: number; end: number }[] = []
  let cursor = 0
  for (const b of busy) {
    if (b.start > cursor) gaps.push({ start: cursor, end: Math.min(b.start, dayEnd) })
    cursor = Math.max(cursor, b.end)
  }
  if (cursor < dayEnd) gaps.push({ start: cursor, end: dayEnd })

  const gap = gaps.filter((g) => g.end - g.start >= MIN_GAP).at(-1)
  if (!gap) return null
  return { start: toHHMM(Math.max(gap.start, gap.end - NEW_BLOCK)), end: toHHMM(gap.end) }
}
