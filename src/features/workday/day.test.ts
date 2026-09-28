import {
  addPlanItem,
  closeDay,
  continuousWorkMs,
  dayState,
  newDay,
  pause,
  planItemSpentMs,
  removePlanItem,
  setFocus,
  setPlanItemDone,
  startBreak,
  startPlanItem,
  startWork,
  stopAt,
  timeByFocus,
  totals,
} from './day'
import { mergeDay } from './merge'
import { defaultSettings, type DayRecord } from './types'

const at = (hhmm: string) => new Date(`2026-09-28T${hhmm}:00`)
const MIN = 60_000

function freshDay(): DayRecord {
  return newDay('2026-09-28', defaultSettings)
}

describe('clock', () => {
  it('moves through idle → working → break → working → paused', () => {
    let day = freshDay()
    expect(dayState(day)).toBe('idle')
    day = startWork(day, at('09:00'))
    expect(dayState(day)).toBe('working')
    day = startBreak(day, at('10:00'), 'coffee')
    expect(dayState(day)).toBe('break')
    day = startWork(day, at('10:15'))
    day = pause(day, at('11:15'))
    expect(dayState(day)).toBe('paused')

    const t = totals(day, at('12:00'))
    expect(t.workMs).toBe(120 * MIN)
    expect(t.breakMs).toBe(15 * MIN)
  })

  it('derives running time from timestamps, not ticks', () => {
    const day = startWork(freshDay(), at('09:00'))
    expect(totals(day, at('09:42')).workMs).toBe(42 * MIN)
  })

  it('splits time per focus, but relabels a block younger than a minute', () => {
    let day = startWork(freshDay(), at('09:00'))
    day = setFocus(day, new Date(at('09:00').getTime() + 30_000), { label: 'Emails' })
    expect(day.segments).toHaveLength(1)
    expect(day.segments[0].focus).toBe('Emails')

    day = setFocus(day, at('09:30'), { label: 'Invoice export' })
    expect(day.segments).toHaveLength(2)
    const byFocus = timeByFocus(day, at('10:30'))
    expect(byFocus.map((f) => [f.label, f.ms / MIN])).toEqual([
      ['Invoice export', 60],
      ['Emails', 30],
    ])
  })

  it('closes a forgotten block at the given time, never before it started', () => {
    let day = startWork(freshDay(), at('09:00'))
    day = stopAt(day, at('17:30'))
    expect(dayState(day)).toBe('paused')
    expect(totals(day, at('23:00')).workMs).toBe(510 * MIN)

    const early = stopAt(startWork(freshDay(), at('09:00')), at('08:00'))
    expect(totals(early, at('23:00')).workMs).toBe(0)
  })
})

describe('continuous work (break nudge)', () => {
  it('counts back to the last break or a pause of 5+ minutes', () => {
    let day = startWork(freshDay(), at('08:00'))
    day = startBreak(day, at('09:00'), 'coffee')
    day = startWork(day, at('09:10'))
    day = pause(day, at('09:40'))
    day = startWork(day, at('09:42')) // 2 minute pause doesn't reset
    expect(continuousWorkMs(day, at('10:00')) / MIN).toBe(48)

    day = pause(day, at('10:00'))
    day = startWork(day, at('10:10')) // 10 minute pause resets
    expect(continuousWorkMs(day, at('10:20')) / MIN).toBe(10)
  })

  it('is zero when not working', () => {
    const day = startBreak(startWork(freshDay(), at('09:00')), at('10:00'), 'lunch')
    expect(continuousWorkMs(day, at('10:30'))).toBe(0)
  })
})

describe('plan', () => {
  it('starts work on a plan item and tracks time against it', () => {
    let day = addPlanItem(freshDay(), { title: 'Review PRs', estimateMinutes: 60 })
    const id = day.plan[0].id
    day = startPlanItem(day, at('09:00'), id)
    expect(dayState(day)).toBe('working')
    expect(day.focus?.planItemId).toBe(id)
    expect(planItemSpentMs(day, id, at('09:45')) / MIN).toBe(45)
  })

  it('finishing the running item clears focus but keeps the clock going', () => {
    let day = addPlanItem(freshDay(), { title: 'Review PRs' })
    const id = day.plan[0].id
    day = startPlanItem(day, at('09:00'), id)
    day = setPlanItemDone(day, at('09:30'), id, true)
    expect(day.plan[0].status).toBe('done')
    expect(day.focus).toBeUndefined()
    expect(dayState(day)).toBe('working')
    expect(day.segments.at(-1)?.planItemId).toBeUndefined()
  })

  it('drops instead of deleting items that have tracked time', () => {
    let day = addPlanItem(freshDay(), { title: 'A' })
    day = addPlanItem(day, { title: 'B' })
    const [a, b] = day.plan
    day = startPlanItem(day, at('09:00'), a.id)
    day = removePlanItem(removePlanItem(day, a.id), b.id)
    expect(day.plan.map((i) => [i.title, i.status])).toEqual([['A', 'dropped']])
  })

  it('carries open items into the next day', () => {
    let day = addPlanItem(freshDay(), { title: 'Done thing' })
    day = addPlanItem(day, { title: 'Unfinished', estimateMinutes: 90 })
    day = addPlanItem(day, { title: 'Not needed' })
    const [done, unfinished, dropped] = day.plan
    day = closeDay(
      day,
      at('17:00'),
      { done: '', next: '' },
      {
        [done.id]: 'done',
        [unfinished.id]: 'carry',
        [dropped.id]: 'drop',
      },
    )
    expect(day.status).toBe('closed')

    const next = newDay('2026-09-29', defaultSettings, day)
    expect(next.plan).toHaveLength(1)
    expect(next.plan[0]).toMatchObject({
      title: 'Unfinished',
      estimateMinutes: 90,
      carriedFrom: '2026-09-28',
      status: 'open',
    })
    expect(next.plan[0].id).not.toBe(unfinished.id)
  })
})

describe('mergeDay', () => {
  it('keeps blocks and plan items from both devices', () => {
    const base = addPlanItem(startWork(freshDay(), at('09:00')), { title: 'Shared' })
    const local = addPlanItem(pause(base, at('10:00')), { title: 'Local item' })
    const remote = addPlanItem(base, { title: 'Remote item' })

    const merged = mergeDay(local, remote)
    expect(merged.plan.map((i) => i.title)).toEqual(['Shared', 'Local item', 'Remote item'])
    expect(merged.segments).toHaveLength(1)
    expect(merged.segments[0].end).toBeDefined()
  })

  it('never leaves two blocks running', () => {
    const local = startWork(freshDay(), at('09:00'))
    const remote = startWork(freshDay(), at('09:05'))
    const merged = mergeDay(local, remote)
    expect(merged.segments.filter((s) => !s.end)).toHaveLength(1)
  })
})
