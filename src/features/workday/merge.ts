import type { DayRecord, Segment, Settings } from './types'

function unionById<T extends { id: string }>(local: T[], remote: T[], pick: (l: T, r: T) => T) {
  const remoteById = new Map(remote.map((r) => [r.id, r]))
  const merged = local.map((l) => {
    const r = remoteById.get(l.id)
    return r ? pick(l, r) : l
  })
  const localIds = new Set(local.map((l) => l.id))
  return [...merged, ...remote.filter((r) => !localIds.has(r.id))]
}

/** A finished block beats a still-running copy of the same block. */
const pickSegment = (l: Segment, r: Segment) => (!l.end && r.end ? r : l)

/**
 * Combines our unsaved day with a newer copy saved elsewhere (another device).
 * Nothing tracked on either side is lost; for the same item our version wins.
 */
export function mergeDay(local: DayRecord, remote: DayRecord): DayRecord {
  const segments = unionById(local.segments, remote.segments, pickSegment).sort((a, b) =>
    a.start.localeCompare(b.start),
  )
  // Only one block may run at a time: close all but the latest open one.
  const open = segments.filter((s) => !s.end)
  const keepOpen = open.at(-1)
  const fixed = segments.map((s) =>
    !s.end && s !== keepOpen ? { ...s, end: keepOpen?.start ?? s.start } : s,
  )
  return {
    ...local,
    planned: local.planned || remote.planned,
    plan: unionById(local.plan, remote.plan, (l) => l),
    segments: fixed,
    status: local.status === 'closed' || remote.status === 'closed' ? 'closed' : 'active',
    summary: local.summary ?? remote.summary,
    updatedAt: local.updatedAt > remote.updatedAt ? local.updatedAt : remote.updatedAt,
  }
}

export function mergeSettings(local: Settings, remote: Settings): Settings {
  const dates = [local.lastActiveDate, remote.lastActiveDate].filter(Boolean) as string[]
  return { ...remote, ...local, lastActiveDate: dates.sort().at(-1) }
}
