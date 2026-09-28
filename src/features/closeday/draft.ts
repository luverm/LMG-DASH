import { planItemSpentMs, timeByFocus } from '@/features/workday/day'
import type { DayRecord, PlanDecision } from '@/features/workday/types'
import { formatDuration } from '@/lib/time'

/**
 * Prefills "Done today" from finished plan items and other focus labels, grouped by project.
 * `projectName` resolves a project id to its title.
 */
export function draftDone(
  day: DayRecord,
  now: Date,
  decisions: Record<string, PlanDecision>,
  projectName: (id?: string) => string | undefined = () => undefined,
): string {
  const lines: { project?: string; text: string }[] = []
  const planIds = new Set<string>()
  for (const item of day.plan) {
    const isDone = item.status === 'done' || decisions[item.id] === 'done'
    if (!isDone) continue
    planIds.add(item.id)
    const ms = planItemSpentMs(day, item.id, now)
    lines.push({
      project: projectName(item.projectId),
      text: ms > 0 ? `${item.title} (${formatDuration(ms)})` : item.title,
    })
  }
  for (const f of timeByFocus(day, now)) {
    if (f.planItemId && planIds.has(f.planItemId)) continue
    if (f.planItemId) continue // unfinished plan items are covered by "next up"
    if (f.ms < 5 * 60_000) continue
    lines.push({ project: projectName(f.projectId), text: `${f.label} (${formatDuration(f.ms)})` })
  }

  const groups = new Map<string, string[]>()
  for (const l of lines) {
    const key = l.project ?? ''
    groups.set(key, [...(groups.get(key) ?? []), `• ${l.text}`])
  }
  const out: string[] = []
  for (const [project, items] of groups) {
    if (project) out.push(`${project}:`)
    out.push(...items)
  }
  return out.join('\n')
}

/** Prefills "Next up" with the items that carry over. */
export function draftNext(day: DayRecord, decisions: Record<string, PlanDecision>): string {
  return day.plan
    .filter((i) => i.status === 'open' && (decisions[i.id] ?? 'carry') === 'carry')
    .map((i) => i.title)
    .join('\n')
}
