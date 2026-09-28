import type { ShapeKind } from '@/components/shapes/shapes'

export type BreakType = 'coffee' | 'lunch' | 'walk' | 'other' | 'focus' | 'away'

/** Break types offered in the break menu. */
export const breakTypes: { type: BreakType; label: string }[] = [
  { type: 'coffee', label: 'Coffee' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'walk', label: 'Walk' },
  { type: 'other', label: 'Other' },
]

const breakLabels: Record<BreakType, string> = {
  coffee: 'Coffee break',
  lunch: 'Lunch break',
  walk: 'Walk',
  other: 'Short break',
  focus: 'Focus break',
  away: 'Away',
}

export const breakLabel = (type?: BreakType) => breakLabels[type ?? 'other']

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
  /** Set when the item was added by a routine, so it's added once per day. */
  routineId?: string
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
  /** Scratchpad for quick notes during the day. */
  notes?: string
  focusSession?: FocusSession
  updatedAt: string
}

/** Pomodoro-style cycles: work for workMinutes, then a break of breakMinutes. */
export interface FocusSession {
  workMinutes: number
  breakMinutes: number
  startedAt: string
  /** Completed work stretches in this session. */
  cycles: number
}

export type FocusPreset = '25/5' | '50/10'

export const focusPresets: Record<FocusPreset, { workMinutes: number; breakMinutes: number }> = {
  '25/5': { workMinutes: 25, breakMinutes: 5 },
  '50/10': { workMinutes: 50, breakMinutes: 10 },
}

/** A plan item that adds itself on the chosen weekdays (0 = Sunday … 6 = Saturday). */
export interface Routine {
  id: string
  title: string
  estimateMinutes?: number
  projectId?: string
  weekdays: number[]
}

export interface Settings {
  version: 1
  targetMinutes: number
  nudgeAfterMinutes: number
  lastActiveDate?: string
  routines: Routine[]
  focusPreset: FocusPreset
  /** Ask about time away after this many minutes hidden or asleep while working; 0 = off. */
  awayMinutes: number
  /** Show system notifications for break reminders and the focus timer. */
  notifications: boolean
}

export const defaultSettings: Settings = {
  version: 1,
  targetMinutes: 8 * 60,
  nudgeAfterMinutes: 50,
  routines: [],
  focusPreset: '25/5',
  awayMinutes: 30,
  notifications: false,
}

/** Fills in fields added after a settings file was first saved. */
export const withDefaults = (s: Partial<Settings> | null): Settings => ({
  ...defaultSettings,
  ...s,
  version: 1,
})

export type DayState = 'idle' | 'working' | 'paused' | 'break' | 'closed'

export type PlanDecision = 'done' | 'carry' | 'drop'
