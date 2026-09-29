export type ProjectStatus =
  'wish' | 'exploring' | 'building' | 'feedback' | 'delivered' | 'parked' | 'declined'
export type Approach = 'ai' | 'automation' | 'tool' | 'process' | 'undecided'
export type Score = 1 | 2 | 3

export interface StatusInfo {
  value: ProjectStatus
  label: string
  /** What this phase means, shown under the phase track. */
  hint: string
  color: string
}

/** The main flow, in order. Parked and declined are side exits. */
export const phases: StatusInfo[] = [
  {
    value: 'wish',
    label: 'Wish',
    hint: 'Noted down. Nothing decided yet.',
    color: 'var(--butter)',
  },
  {
    value: 'exploring',
    label: 'Exploring',
    hint: 'Figuring out the problem and possible solutions.',
    color: 'var(--sky)',
  },
  { value: 'building', label: 'Building', hint: "You're making it.", color: 'var(--lavender)' },
  {
    value: 'feedback',
    label: 'Awaiting feedback',
    hint: 'Shared with the requester; waiting for their reaction.',
    color: 'var(--peach)',
  },
  { value: 'delivered', label: 'Delivered', hint: 'Done and in use.', color: 'var(--mint)' },
]

export const sideStatuses: StatusInfo[] = [
  { value: 'parked', label: 'Parked', hint: 'On hold for now.', color: 'var(--text-muted)' },
  { value: 'declined', label: 'Declined', hint: 'Decided not to do it.', color: 'var(--rose)' },
]

export const statuses: StatusInfo[] = [...phases, ...sideStatuses]

export const statusInfo = (s: ProjectStatus): StatusInfo => statuses.find((x) => x.value === s)!

/** Open work: everything in the main flow before delivered. */
export const activeStatuses: ProjectStatus[] = ['wish', 'exploring', 'building', 'feedback']

export const approaches: { value: Approach; label: string }[] = [
  { value: 'undecided', label: 'Undecided' },
  { value: 'ai', label: 'AI' },
  { value: 'automation', label: 'Automation / script' },
  { value: 'tool', label: 'Tool / app' },
  { value: 'process', label: 'Process change' },
]

export interface ProjectNote {
  id: string
  at: string
  text: string
}

export interface ProjectLink {
  id: string
  label: string
  url: string
}

export interface Project {
  id: string
  title: string
  requestedBy: string[]
  team?: string
  problem?: string
  wish?: string
  approach: Approach
  impact?: Score
  effort?: Score
  status: ProjectStatus
  links: ProjectLink[]
  notes: ProjectNote[]
  /** Days with tracked time on this project, so totals only load those day files. */
  workDates: string[]
  createdAt: string
  updatedAt: string
  deliveredAt?: string
  /** When the project entered its current status. */
  statusSince?: string
  deletedAt?: string
}

export interface ProjectsFile {
  version: 1
  projects: Record<string, Project>
}

export const emptyProjectsFile: ProjectsFile = { version: 1, projects: {} }
