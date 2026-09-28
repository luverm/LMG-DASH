import { createId } from '@/lib/time'
import type { Approach, Project, ProjectsFile, ProjectStatus } from './types'
import { activeStatuses, statuses } from './types'

export function createProject(input: {
  title: string
  requestedBy?: string[]
  problem?: string
  now?: Date
}): Project {
  const at = (input.now ?? new Date()).toISOString()
  return {
    id: createId(),
    title: input.title.trim(),
    requestedBy: input.requestedBy ?? [],
    problem: input.problem?.trim() || undefined,
    approach: 'undecided',
    status: 'wish',
    links: [],
    notes: [],
    workDates: [],
    createdAt: at,
    updatedAt: at,
  }
}

/** Applies a patch, stamping updatedAt and deliveredAt. */
export function patchProject(p: Project, patch: Partial<Project>, now = new Date()): Project {
  const next = { ...p, ...patch, updatedAt: now.toISOString() }
  if (patch.status === 'delivered' && p.status !== 'delivered') next.deliveredAt = now.toISOString()
  if (patch.status && patch.status !== 'delivered') next.deliveredAt = undefined
  return next
}

/** "Anna, Bram" → ["Anna", "Bram"], trimmed and de-duplicated (case-insensitive). */
export function parsePeople(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of text.split(',')) {
    const name = raw.trim()
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase())
      out.push(name)
    }
  }
  return out
}

export function allPeople(projects: Project[]): string[] {
  return parsePeople(projects.flatMap((p) => p.requestedBy).join(',')).sort((a, b) =>
    a.localeCompare(b),
  )
}

/** Higher is a better next pick: impact counts double, effort counts against. Unscored sinks. */
export function quickWinScore(p: Project): number {
  if (!p.impact || !p.effort) return -10
  return p.impact * 2 - p.effort
}

export interface ProjectFilter {
  search: string
  status: 'active' | 'all' | ProjectStatus
  person: string
  approach: 'all' | Approach
  sort: 'updated' | 'quickwins'
}

export const defaultFilter: ProjectFilter = {
  search: '',
  status: 'active',
  person: '',
  approach: 'all',
  sort: 'updated',
}

export function filterProjects(projects: Project[], f: ProjectFilter): Project[] {
  const q = f.search.trim().toLowerCase()
  return projects
    .filter((p) => !p.deletedAt)
    .filter((p) =>
      f.status === 'all'
        ? true
        : f.status === 'active'
          ? activeStatuses.includes(p.status)
          : p.status === f.status,
    )
    .filter(
      (p) => !f.person || p.requestedBy.some((r) => r.toLowerCase() === f.person.toLowerCase()),
    )
    .filter((p) => f.approach === 'all' || p.approach === f.approach)
    .filter(
      (p) =>
        !q ||
        [p.title, p.problem, p.wish, p.team, ...p.requestedBy, ...p.notes.map((n) => n.text)]
          .filter(Boolean)
          .some((t) => t!.toLowerCase().includes(q)),
    )
    .sort((a, b) =>
      f.sort === 'quickwins'
        ? quickWinScore(b) - quickWinScore(a) || b.updatedAt.localeCompare(a.updatedAt)
        : b.updatedAt.localeCompare(a.updatedAt),
    )
}

/** Groups projects by status in pipeline order, keeping the given order within a group. */
export function groupByStatus(projects: Project[]) {
  return statuses
    .map((s) => ({ ...s, projects: projects.filter((p) => p.status === s.value) }))
    .filter((g) => g.projects.length > 0)
}

function unionById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const ids = new Set(a.map((x) => x.id))
  return [...a, ...b.filter((x) => !ids.has(x.id))]
}

/** Per project the newest edit wins; notes, links and work dates from both sides are kept. */
export function mergeProjects(local: ProjectsFile, remote: ProjectsFile): ProjectsFile {
  const projects: Record<string, Project> = { ...remote.projects }
  for (const [id, l] of Object.entries(local.projects)) {
    const r = remote.projects[id]
    if (!r) {
      projects[id] = l
      continue
    }
    const newer = l.updatedAt >= r.updatedAt ? l : r
    projects[id] = {
      ...newer,
      notes: unionById(l.notes, r.notes).sort((a, b) => b.at.localeCompare(a.at)),
      links: unionById(newer.links, newer === l ? r.links : l.links),
      workDates: [...new Set([...l.workDates, ...r.workDates])].sort(),
      deletedAt: l.deletedAt ?? r.deletedAt,
    }
  }
  return { version: 1, projects }
}
