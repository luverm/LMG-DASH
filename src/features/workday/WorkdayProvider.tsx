import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useData } from '@/app/data/DataContext'
import { Shape } from '@/components/shapes/Shape'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { dateKey } from '@/lib/time'
import { newDay, openSegment, stopAt } from './day'
import { mergeDay, mergeSettings } from './merge'
import { defaultSettings, type DayRecord, type Settings } from './types'
import { WorkdayContext, type DayOp, type WorkdayContextValue } from './WorkdayContext'

interface Loaded {
  settings: Settings
  today: DayRecord
  previous: DayRecord | null
}

export function WorkdayProvider({ children }: { children: ReactNode }) {
  const { engine, paths } = useData()
  const [dateKeyNow, setDateKeyNow] = useState(() => dateKey(new Date()))
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const ref = useRef<Loaded | null>(null)

  const commit = useCallback((next: Loaded) => {
    ref.current = next
    setLoaded(next)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const settings =
        (await engine.load<Settings>(paths.settings, { merge: mergeSettings })) ?? defaultSettings
      let today = await engine.load<DayRecord>(paths.day(dateKeyNow), { merge: mergeDay })
      const previousDate =
        today?.previousDate ??
        (settings.lastActiveDate && settings.lastActiveDate < dateKeyNow
          ? settings.lastActiveDate
          : undefined)
      const previous = previousDate
        ? await engine.load<DayRecord>(paths.day(previousDate), { merge: mergeDay })
        : null
      today ??= newDay(dateKeyNow, settings, previous)
      if (!cancelled) commit({ settings, today, previous })
    }
    setError(null)
    load().catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      cancelled = true
    }
  }, [engine, paths, dateKeyNow, attempt, commit])

  // Pick up merges the engine made after a conflict with another device.
  useEffect(
    () =>
      engine.subscribe(() => {
        const cur = ref.current
        if (!cur) return
        const today = engine.peek<DayRecord>(paths.day(cur.today.date))
        const settings = engine.peek<Settings>(paths.settings)
        if ((today && today !== cur.today) || (settings && settings !== cur.settings)) {
          commit({ ...cur, today: today ?? cur.today, settings: settings ?? cur.settings })
        }
      }),
    [engine, paths, commit],
  )

  // Roll over to a new day after midnight, once nothing is running.
  useEffect(() => {
    const id = setInterval(() => {
      const key = dateKey(new Date())
      const cur = ref.current
      if (cur && key !== cur.today.date && !openSegment(cur.today)) setDateKeyNow(key)
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  const saveSettings = useCallback(
    (cur: Loaded, settings: Settings) => {
      engine.set(paths.settings, settings, { merge: mergeSettings })
      return { ...cur, settings }
    },
    [engine, paths],
  )

  const update = useCallback(
    (op: DayOp, options: { immediate?: boolean } = {}) => {
      let cur = ref.current
      if (!cur) return
      const today = op(cur.today, new Date())
      if (today === cur.today) return
      engine.set(paths.day(today.date), today, { merge: mergeDay, immediate: options.immediate })
      if (cur.settings.lastActiveDate !== today.date) {
        cur = saveSettings(cur, { ...cur.settings, lastActiveDate: today.date })
      }
      commit({ ...cur, today })
    },
    [engine, paths, commit, saveSettings],
  )

  const updateSettings = useCallback(
    (patch: Partial<Omit<Settings, 'version'>>) => {
      const cur = ref.current
      if (cur) commit(saveSettings(cur, { ...cur.settings, ...patch }))
    },
    [commit, saveSettings],
  )

  const resolveRecovery = useCallback(
    (end: Date) => {
      const cur = ref.current
      if (!cur?.previous) return
      const previous = stopAt(cur.previous, end)
      engine.set(paths.day(previous.date), previous, { merge: mergeDay, immediate: true })
      commit({ ...cur, previous })
    },
    [engine, paths, commit],
  )

  const value = useMemo<WorkdayContextValue | null>(() => {
    if (!loaded) return null
    const recovery = loaded.previous && openSegment(loaded.previous) ? loaded.previous : null
    return { ...loaded, recovery, update, updateSettings, resolveRecovery }
  }, [loaded, update, updateSettings, resolveRecovery])

  if (error) {
    return (
      <div role="alert" style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <Shape kind="triangle" size={40} color="var(--rose)" />
        <p>Couldn't load your data: {error}</p>
        <ShapeButton shape="circle" onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </ShapeButton>
      </div>
    )
  }
  if (!value) {
    return (
      <div aria-busy="true" style={{ display: 'grid', placeItems: 'center', paddingTop: '4rem' }}>
        <Shape kind="hexagon" size={36} />
      </div>
    )
  }
  return <WorkdayContext.Provider value={value}>{children}</WorkdayContext.Provider>
}
