import type { Project } from '@/features/projects/types'
import { createId } from '@/lib/time'
import type { Solution, SolutionsFile, SolutionStatus } from './types'

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

/** Total weekly time saved by live solutions. */
export function totalSavedMinutes(list: Solution[]): number {
  return list
    .filter((s) => !s.deletedAt && s.status === 'live')
    .reduce((sum, s) => sum + (s.savedMinutesPerWeek ?? 0), 0)
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
