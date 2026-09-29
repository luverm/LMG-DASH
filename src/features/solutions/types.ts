export type SolutionStatus = 'draft' | 'live' | 'retired'

export const solutionStatuses: { value: SolutionStatus; label: string }[] = [
  { value: 'draft', label: 'In progress' },
  { value: 'live', label: 'Live' },
  { value: 'retired', label: 'Retired' },
]

export interface SolutionLink {
  id: string
  label: string
  url: string
}

/** A documented solution: something you built that solves a problem for coworkers. */
export interface Solution {
  id: string
  title: string
  /** One or two sentences: what it does, in plain words. */
  summary?: string
  /** The problem it solves. */
  problem?: string
  /** How it works: the steps, flow, parts involved. */
  howItWorks?: string
  /** How to use it (for the people using it). */
  usage?: string
  /** How to run, maintain or fix it (for future you). */
  maintenance?: string
  /** Tools and tech, e.g. "Power Automate", "Python", "Claude". */
  tools: string[]
  usedBy: string[]
  team?: string
  status: SolutionStatus
  usesAi: boolean
  /** Rough time saved per week, in minutes. */
  savedMinutesPerWeek?: number
  projectIds: string[]
  links: SolutionLink[]
  createdAt: string
  updatedAt: string
  liveSince?: string
  deletedAt?: string
}

export interface SolutionsFile {
  version: 1
  solutions: Record<string, Solution>
}

export const emptySolutionsFile: SolutionsFile = { version: 1, solutions: {} }
