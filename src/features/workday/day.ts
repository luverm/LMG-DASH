import { createId } from '@/lib/time'
import type {
  BreakType,
  DayRecord,
  DayState,
  DaySummary,
  FocusRef,
  PlanDecision,
  PlanItem,
  Segment,
  Settings,
} from './types'

/* ---------- Creation ---------- */

/** A fresh day. Open plan items from the previous day carry over. */
export function newDay(date: string, settings: Settings, previous?: DayRecord | null): DayRecord {
  const carried: PlanItem[] =
    previous?.plan
      .filter((i) => i.status === 'open')
      .map((i) => ({
        id: createId(),
        title: i.title,
        estimateMinutes: i.estimateMinutes,
        projectId: i.projectId,
        status: 'open',
        carriedFrom: previous.date,
      })) ?? []
  return {
    version: 1,
    date,
    targetMinutes: settings.targetMinutes,
    planned: false,
    plan: carried,
    segments: [],
    status: 'active',
    previousDate: previous?.date,
    updatedAt: new Date().toISOString(),
  }
}

/* ---------- Selectors ---------- */

export const openSegment = (day: DayRecord): Segment | undefined => day.segments.find((s) => !s.end)

export function dayState(day: DayRecord): DayState {
  if (day.status === 'closed') return 'closed'
  const open = openSegment(day)
  if (open) return open.kind === 'work' ? 'working' : 'break'
  return day.segments.length ? 'paused' : 'idle'
}

export function segmentMs(s: Segment, now: Date): number {
  const end = s.end ? new Date(s.end).getTime() : now.getTime()
  return Math.max(0, end - new Date(s.start).getTime())
}

export function totals(day: DayRecord, now: Date) {
  let workMs = 0
  let breakMs = 0
  for (const s of day.segments) {
    if (s.kind === 'work') workMs += segmentMs(s, now)
    else breakMs += segmentMs(s, now)
  }
  return { workMs, breakMs }
}

export interface FocusTime {
  key: string
  label: string
  planItemId?: string
  projectId?: string
  ms: number
}

/** Work time grouped by plan item or focus label, largest first. */
export function timeByFocus(day: DayRecord, now: Date): FocusTime[] {
  const map = new Map<string, FocusTime>()
  for (const s of day.segments) {
    if (s.kind !== 'work') continue
    const label = s.focus?.trim() || 'Unlabelled work'
    const key = s.planItemId ?? `label:${label.toLowerCase()}`
    const entry = map.get(key) ?? {
      key,
      label,
      planItemId: s.planItemId,
      projectId: s.projectId,
      ms: 0,
    }
    entry.ms += segmentMs(s, now)
    map.set(key, entry)
  }
  return [...map.values()].sort((a, b) => b.ms - a.ms)
}

export function planItemSpentMs(day: DayRecord, itemId: string, now: Date): number {
  return day.segments
    .filter((s) => s.kind === 'work' && s.planItemId === itemId)
    .reduce((sum, s) => sum + segmentMs(s, now), 0)
}

export function plannedMinutes(day: DayRecord): number {
  return day.plan
    .filter((i) => i.status !== 'dropped')
    .reduce((sum, i) => sum + (i.estimateMinutes ?? 0), 0)
}

const RESET_GAP_MS = 5 * 60_000

/**
 * Work time since the last real break: a break segment, or a pause of 5+ minutes.
 * Zero unless currently working.
 */
export function continuousWorkMs(day: DayRecord, now: Date): number {
  const sorted = [...day.segments].sort((a, b) => a.start.localeCompare(b.start))
  const last = sorted.at(-1)
  if (!last || last.end || last.kind !== 'work') return 0
  let ms = 0
  let nextStart = now.getTime()
  for (let i = sorted.length - 1; i >= 0; i--) {
    const s = sorted[i]
    if (s.kind === 'break') break
    const end = s.end ? new Date(s.end).getTime() : now.getTime()
    if (nextStart - end >= RESET_GAP_MS) break
    ms += segmentMs(s, now)
    nextStart = new Date(s.start).getTime()
  }
  return ms
}

/* ---------- Clock operations (pure: return a new day) ---------- */

const touch = (day: DayRecord, patch: Partial<DayRecord>): DayRecord => ({
  ...day,
  ...patch,
  updatedAt: new Date().toISOString(),
})

function closeOpen(day: DayRecord, at: Date): Segment[] {
  return day.segments.map((s) => (s.end ? s : { ...s, end: at.toISOString() }))
}

function workSegment(focus: FocusRef | undefined, now: Date): Segment {
  return {
    id: createId(),
    kind: 'work',
    focus: focus?.label,
    planItemId: focus?.planItemId,
    projectId: focus?.projectId,
    start: now.toISOString(),
  }
}

export function startWork(day: DayRecord, now: Date): DayRecord {
  if (dayState(day) === 'working') return day
  return touch(day, {
    status: 'active',
    segments: [...closeOpen(day, now), workSegment(day.focus, now)],
  })
}

export function pause(day: DayRecord, now: Date): DayRecord {
  if (!openSegment(day)) return day
  return touch(day, { segments: closeOpen(day, now) })
}

export function startBreak(day: DayRecord, now: Date, breakType: BreakType): DayRecord {
  const segment: Segment = { id: createId(), kind: 'break', breakType, start: now.toISOString() }
  return touch(day, { segments: [...closeOpen(day, now), segment] })
}

/** Ends a break (or pause) and continues working on the current focus. */
export const resumeWork = startWork

const RELABEL_WINDOW_MS = 60_000

/**
 * Sets the current focus. While working, the running block is split so each focus
 * gets its own time; a block younger than a minute is just relabelled instead.
 */
export function setFocus(day: DayRecord, now: Date, focus: FocusRef | undefined): DayRecord {
  const open = openSegment(day)
  if (!open || open.kind !== 'work') return touch(day, { focus })
  const labelled = {
    focus: focus?.label,
    planItemId: focus?.planItemId,
    projectId: focus?.projectId,
  }
  if (segmentMs(open, now) < RELABEL_WINDOW_MS) {
    return touch(day, {
      focus,
      segments: day.segments.map((s) => (s.id === open.id ? { ...s, ...labelled } : s)),
    })
  }
  return touch(day, { focus, segments: [...closeOpen(day, now), workSegment(focus, now)] })
}

/** Closes a block left running on an earlier day at the time the user says they stopped. */
export function stopAt(day: DayRecord, end: Date): DayRecord {
  const open = openSegment(day)
  if (!open) return day
  const safeEnd = new Date(Math.max(end.getTime(), new Date(open.start).getTime()))
  return touch(day, { segments: closeOpen(day, safeEnd) })
}

/* ---------- Plan operations ---------- */

export function addPlanItem(
  day: DayRecord,
  item: { title: string; estimateMinutes?: number; projectId?: string },
): DayRecord {
  const title = item.title.trim()
  if (!title) return day
  const planItem: PlanItem = {
    id: createId(),
    title,
    estimateMinutes: item.estimateMinutes,
    projectId: item.projectId,
    status: 'open',
  }
  return touch(day, { plan: [...day.plan, planItem] })
}

export function updatePlanItem(
  day: DayRecord,
  id: string,
  patch: Partial<Pick<PlanItem, 'title' | 'estimateMinutes' | 'projectId'>>,
): DayRecord {
  const plan = day.plan.map((i) => (i.id === id ? { ...i, ...patch } : i))
  // Keep the running block's label in sync with a renamed focus item.
  const focus =
    day.focus?.planItemId === id
      ? {
          ...day.focus,
          label: patch.title ?? day.focus.label,
          projectId: 'projectId' in patch ? patch.projectId : day.focus.projectId,
        }
      : day.focus
  return touch(day, { plan, focus })
}

/** Removes an item; items with tracked time are marked dropped so history stays intact. */
export function removePlanItem(day: DayRecord, id: string): DayRecord {
  const tracked = day.segments.some((s) => s.planItemId === id)
  const plan = tracked
    ? day.plan.map((i) => (i.id === id ? { ...i, status: 'dropped' as const } : i))
    : day.plan.filter((i) => i.id !== id)
  const focus = day.focus?.planItemId === id ? undefined : day.focus
  return touch(day, { plan, focus })
}

export function movePlanItem(day: DayRecord, id: string, toIndex: number): DayRecord {
  const from = day.plan.findIndex((i) => i.id === id)
  if (from < 0) return day
  const plan = [...day.plan]
  const [item] = plan.splice(from, 1)
  plan.splice(Math.max(0, Math.min(toIndex, plan.length)), 0, item)
  return touch(day, { plan })
}

/** Starts (or switches) the clock onto a plan item. */
export function startPlanItem(day: DayRecord, now: Date, id: string): DayRecord {
  const item = day.plan.find((i) => i.id === id)
  if (!item) return day
  const focus: FocusRef = { label: item.title, planItemId: item.id, projectId: item.projectId }
  const reopened =
    item.status === 'open'
      ? day
      : touch(day, {
          plan: day.plan.map((i) => (i.id === id ? { ...i, status: 'open' as const } : i)),
        })
  const focused = setFocus(reopened, now, focus)
  return dayState(focused) === 'working' ? focused : startWork(focused, now)
}

/** Marks an item done (or open again). Finishing the current focus clears it; the clock keeps running. */
export function setPlanItemDone(day: DayRecord, now: Date, id: string, done: boolean): DayRecord {
  const plan = day.plan.map((i) =>
    i.id === id
      ? {
          ...i,
          status: done ? ('done' as const) : ('open' as const),
          doneAt: done ? now.toISOString() : undefined,
        }
      : i,
  )
  const updated = touch(day, { plan })
  return done && day.focus?.planItemId === id ? setFocus(updated, now, undefined) : updated
}

export const finishPlanning = (day: DayRecord): DayRecord => touch(day, { planned: true })

/* ---------- Closing ---------- */

export function closeDay(
  day: DayRecord,
  now: Date,
  summary: Omit<DaySummary, 'closedAt'>,
  decisions: Record<string, PlanDecision>,
): DayRecord {
  const plan = day.plan.map((i): PlanItem => {
    if (i.status !== 'open') return i
    const decision = decisions[i.id] ?? 'carry'
    if (decision === 'done') return { ...i, status: 'done', doneAt: now.toISOString() }
    if (decision === 'drop') return { ...i, status: 'dropped' }
    return i
  })
  return touch(day, {
    segments: closeOpen(day, now),
    plan,
    status: 'closed',
    focus: undefined,
    summary: { ...summary, closedAt: now.toISOString() },
  })
}

/** Lets you keep working after closing by accident. The summary is kept. */
export const reopenDay = (day: DayRecord): DayRecord => touch(day, { status: 'active' })
