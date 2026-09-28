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
