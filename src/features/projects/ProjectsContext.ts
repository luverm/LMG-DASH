import { createContext, useContext } from 'react'
import type { Project } from './types'

export interface ProjectsContextValue {
  /** All projects that aren't deleted. */
  projects: Project[]
  get(id: string | undefined): Project | undefined
  projectName(id?: string): string | undefined
  people: string[]
  create(input: { title: string; requestedBy?: string[]; problem?: string }): Project
  update(id: string, patch: Partial<Project> | ((p: Project) => Partial<Project>)): void
  addNote(id: string, text: string): void
  markWorked(id: string, date: string): void
  remove(id: string): void
}

export const ProjectsContext = createContext<ProjectsContextValue | null>(null)

export function useProjects(): ProjectsContextValue {
  const ctx = useContext(ProjectsContext)
  if (!ctx) throw new Error('useProjects must be used inside ProjectsProvider')
  return ctx
}
