import type { ShapeKind } from '@/components/shapes/shapes'

export type BreakType = 'coffee' | 'lunch' | 'walk' | 'other'

export const breakTypes: { type: BreakType; label: string }[] = [
  { type: 'coffee', label: 'Coffee' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'walk', label: 'Walk' },
  { type: 'other', label: 'Other' },
]

/** What you're working on: free text, or a plan item (optionally tied to a project). */
export interface FocusRef {
  label: string
  planItemId?: string
  projectId?: string
}

export interface Segment {
  id: string
  kind: 'work' | 'break'
  breakType?: BreakType
  focus?: string
  planItemId?: string
  projectId?: string
  start: string // ISO timestamp
  end?: string // missing while running
}

export interface PlanItem {
  id: string
  title: string
  estimateMinutes?: number
  status: 'open' | 'done' | 'dropped'
  carriedFrom?: string // YYYY-MM-DD
  projectId?: string
  doneAt?: string
}

export type Mood = ShapeKind

export interface DaySummary {
  done: string
  next: string
  blockers?: string
  mood?: Mood
  closedAt: string
}

export interface DayRecord {
  version: 1
  date: string // YYYY-MM-DD, local
  targetMinutes: number
  /** True once "Plan your day" was finished or skipped. */
  planned: boolean
  plan: PlanItem[] // array order is display order
  segments: Segment[]
  status: 'active' | 'closed'
  focus?: FocusRef
  summary?: DaySummary
  /** The last worked day before this one, for carry-over and "pick up where you left off". */
  previousDate?: string
  updatedAt: string
}

export interface Settings {
  version: 1
  targetMinutes: number
  nudgeAfterMinutes: number
  lastActiveDate?: string
}

export const defaultSettings: Settings = {
  version: 1,
  targetMinutes: 8 * 60,
  nudgeAfterMinutes: 50,
}

export type DayState = 'idle' | 'working' | 'paused' | 'break' | 'closed'

export type PlanDecision = 'done' | 'carry' | 'drop'
