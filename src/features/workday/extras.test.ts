import {
  endFocusSession,
  focusBreak,
  focusWorkMs,
  newDay,
  replaceSegments,
  resolveAway,
  setNotes,
  startBreak,
  startFocusSession,
  startWork,
  totals,
  dayState,
} from './day'
import { defaultSettings, type DayRecord } from './types'

const at = (hhmm: string) => new Date(`2026-09-28T${hhmm}:00`)
const MIN = 60_000
const fresh = (): DayRecord => newDay('2026-09-28', defaultSettings) // a Monday

describe('routines', () => {
  const settings = {
    ...defaultSettings,
    routines: [
      { id: 'r1', title: 'Standup', estimateMinutes: 15, weekdays: [1, 2, 3, 4, 5] },
      { id: 'r2', title: 'Weekly review', weekdays: [5] },
    ],
  }

  it('adds routines due on that weekday, before carried items', () => {
    const monday = newDay('2026-09-28', settings)
    expect(monday.plan.map((i) => i.title)).toEqual(['Standup'])
    expect(monday.plan[0]).toMatchObject({ routineId: 'r1', estimateMinutes: 15 })
    const friday = newDay('2026-10-02', settings)
    expect(friday.plan.map((i) => i.title)).toEqual(['Standup', 'Weekly review'])
  })

  it("doesn't carry over unfinished routine items (they come back by themselves)", () => {
    const monday = newDay('2026-09-28', settings)
    const tuesday = newDay('2026-09-29', settings, monday)
    expect(tuesday.plan.map((i) => i.title)).toEqual(['Standup'])
  })
})

describe('focus timer', () => {
  it('counts work since the session started or the last break', () => {
    let day = startFocusSession(fresh(), at('09:00'), { workMinutes: 25, breakMinutes: 5 })
    expect(dayState(day)).toBe('working')
    expect(focusWorkMs(day, at('09:20')) / MIN).toBe(20)

    day = focusBreak(day, at('09:25'))
    expect(day.focusSession?.cycles).toBe(1)
    expect(day.segments.at(-1)).toMatchObject({ kind: 'break', breakType: 'focus' })

    day = startWork(day, at('09:30'))
    expect(focusWorkMs(day, at('09:40')) / MIN).toBe(10)
    expect(endFocusSession(day).focusSession).toBeUndefined()
  })
})

describe('time away', () => {
  const working = () => startWork(fresh(), at('09:00'))

  it('keeps the time as work', () => {
    const day = resolveAway(working(), at('10:00'), at('11:00'), 'work')
    expect(totals(day, at('11:30')).workMs / MIN).toBe(150)
  })

  it('records it as a break and keeps the clock going', () => {
    const day = resolveAway(working(), at('10:00'), at('11:00'), 'break')
    const t = totals(day, at('11:30'))
    expect([t.workMs / MIN, t.breakMs / MIN]).toEqual([90, 60])
    expect(dayState(day)).toBe('working')
  })

  it("drops it when you weren't working", () => {
    const day = resolveAway(working(), at('10:00'), at('11:00'), 'none')
    const t = totals(day, at('11:30'))
    expect([t.workMs / MIN, t.breakMs / MIN]).toEqual([90, 0])
  })

  it('does nothing while on a break', () => {
    const day = startBreak(working(), at('09:30'), 'lunch')
    expect(resolveAway(day, at('10:00'), at('11:00'), 'none')).toBe(day)
  })
})

describe('editing and notes', () => {
  it('replaces blocks sorted by start', () => {
    const day = replaceSegments(fresh(), [
      { id: 'b', kind: 'work', start: at('11:00').toISOString(), end: at('12:00').toISOString() },
      { id: 'a', kind: 'work', start: at('09:00').toISOString(), end: at('10:00').toISOString() },
    ])
    expect(day.segments.map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('stores notes and skips no-op updates', () => {
    const day = setNotes(fresh(), 'Call Anna')
    expect(day.notes).toBe('Call Anna')
    expect(setNotes(day, 'Call Anna')).toBe(day)
    expect(setNotes(day, '').notes).toBeUndefined()
  })
})
