export type SolutionStatus = 'draft' | 'live' | 'retired'

export const solutionStatuses: { value: SolutionStatus; label: string }[] = [
  { value: 'draft', label: 'In progress' },
  { value: 'live', label: 'Live' },
  { value: 'retired', label: 'Retired' },
]

export type SavedPeriod = 'week' | 'month' | 'year'

export const savedPeriods: { value: SavedPeriod; label: string; perYear: number }[] = [
  { value: 'week', label: 'per week', perYear: 52 },
  { value: 'month', label: 'per month', perYear: 12 },
  { value: 'year', label: 'per year', perYear: 1 },
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
  /** Rough time saved, in minutes, per `savedPer` period. */
  savedMinutes?: number
  savedPer?: SavedPeriod
  /** Older field from before periods existed; read as a weekly amount. */
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
