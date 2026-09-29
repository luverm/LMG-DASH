import type { Project } from '@/features/projects/types'
import { createId } from '@/lib/time'
import { formatMinutes } from '@/lib/time'
import {
  savedPeriods,
  type SavedPeriod,
  type Solution,
  type SolutionsFile,
  type SolutionStatus,
} from './types'

export function createSolution(
  input: Partial<Solution> & { title: string },
  now = new Date(),
): Solution {
  const at = now.toISOString()
  return {
    tools: [],
    usedBy: [],
    status: 'draft',
    usesAi: false,
    projectIds: [],
    links: [],
    ...input,
    id: createId(),
    title: input.title.trim(),
    createdAt: at,
    updatedAt: at,
  }
}

/** A first draft of the documentation, taken from the project it came from. */
export function solutionFromProject(p: Project): Partial<Solution> & { title: string } {
  return {
    title: p.title,
    problem: [p.problem, p.wish && `Wish: ${p.wish}`].filter(Boolean).join('\n\n') || undefined,
    usedBy: p.requestedBy,
    team: p.team,
    usesAi: p.approach === 'ai',
    projectIds: [p.id],
    links: p.links.map((l) => ({ ...l, id: createId() })),
  }
}

export function patchSolution(s: Solution, patch: Partial<Solution>, now = new Date()): Solution {
  const next = { ...s, ...patch, updatedAt: now.toISOString() }
  if (patch.status === 'live' && s.status !== 'live') next.liveSince = now.toISOString()
  return next
}

/** "Power Automate, python ,Python" → ["Power Automate", "python"] (case-insensitive unique). */
export function parseList(text: string): string[] {
  const seen = new Set<string>()
  return text
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()))
}

export function allTools(solutions: Solution[]): string[] {
  return parseList(solutions.flatMap((s) => s.tools).join(',')).sort((a, b) => a.localeCompare(b))
}

export interface SolutionFilter {
  search: string
  status: 'all' | SolutionStatus
  tool: string
}

export const defaultSolutionFilter: SolutionFilter = { search: '', status: 'all', tool: '' }

export function filterSolutions(list: Solution[], f: SolutionFilter): Solution[] {
  const q = f.search.trim().toLowerCase()
  return list
    .filter((s) => !s.deletedAt)
    .filter((s) => f.status === 'all' || s.status === f.status)
    .filter((s) => !f.tool || s.tools.some((t) => t.toLowerCase() === f.tool.toLowerCase()))
    .filter(
      (s) =>
        !q ||
        [
          s.title,
          s.summary,
          s.problem,
          s.howItWorks,
          s.usage,
          s.maintenance,
          s.team,
          ...s.tools,
          ...s.usedBy,
        ]
          .filter(Boolean)
          .some((t) => t!.toLowerCase().includes(q)),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** The time saved as entered (with a period), reading old weekly-only data too. */
export function savedTime(s: Solution): { minutes: number; per: SavedPeriod } | null {
  if (s.savedMinutes) return { minutes: s.savedMinutes, per: s.savedPer ?? 'week' }
  if (s.savedMinutesPerWeek) return { minutes: s.savedMinutesPerWeek, per: 'week' }
  return null
}

/** Time saved per year, so weekly, monthly and yearly savings can be added up. */
export function yearlySavedMinutes(s: Solution): number {
  const t = savedTime(s)
  if (!t) return 0
  return t.minutes * (savedPeriods.find((p) => p.value === t.per)?.perYear ?? 1)
}

/** Total time saved per year by live solutions. */
export function totalSavedMinutesPerYear(list: Solution[]): number {
  return list
    .filter((s) => !s.deletedAt && s.status === 'live')
    .reduce((sum, s) => sum + yearlySavedMinutes(s), 0)
}

/** "2h per year", "30m per week" */
export function formatSaved(s: Solution): string | null {
  const t = savedTime(s)
  if (!t) return null
  return `${formatMinutes(t.minutes)} ${savedPeriods.find((p) => p.value === t.per)?.label ?? ''}`.trim()
}

function unionById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const ids = new Set(a.map((x) => x.id))
  return [...a, ...b.filter((x) => !ids.has(x.id))]
}

/** Per solution the newest edit wins; links and linked projects from both sides are kept. */
export function mergeSolutions(local: SolutionsFile, remote: SolutionsFile): SolutionsFile {
  const solutions: Record<string, Solution> = { ...remote.solutions }
  for (const [id, l] of Object.entries(local.solutions)) {
    const r = remote.solutions[id]
    if (!r) {
      solutions[id] = l
      continue
    }
    const newer = l.updatedAt >= r.updatedAt ? l : r
    solutions[id] = {
      ...newer,
      links: unionById(newer.links, newer === l ? r.links : l.links),
      projectIds: [...new Set([...l.projectIds, ...r.projectIds])],
      deletedAt: l.deletedAt ?? r.deletedAt,
    }
  }
  return { version: 1, solutions }
}
