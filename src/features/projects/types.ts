export type ProjectStatus = 'wish' | 'exploring' | 'building' | 'delivered' | 'parked' | 'declined'
export type Approach = 'ai' | 'automation' | 'tool' | 'process' | 'undecided'
export type Score = 1 | 2 | 3

export const statuses: { value: ProjectStatus; label: string }[] = [
  { value: 'wish', label: 'Wish' },
  { value: 'exploring', label: 'Exploring' },
  { value: 'building', label: 'Building' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'parked', label: 'Parked' },
  { value: 'declined', label: 'Declined' },
]

export const activeStatuses: ProjectStatus[] = ['wish', 'exploring', 'building']

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
  deletedAt?: string
}

export interface ProjectsFile {
  version: 1
  projects: Record<string, Project>
}

export const emptyProjectsFile: ProjectsFile = { version: 1, projects: {} }
