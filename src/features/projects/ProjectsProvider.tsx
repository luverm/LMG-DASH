import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useData } from '@/app/data/DataContext'
import { createId } from '@/lib/time'
import { allPeople, createProject, mergeProjects, patchProject } from './projects'
import { ProjectsContext, type ProjectsContextValue } from './ProjectsContext'
import { emptyProjectsFile, type Project, type ProjectsFile } from './types'

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { engine, paths } = useData()
  const [file, setFile] = useState<ProjectsFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<ProjectsFile | null>(null)

  useEffect(() => {
    let cancelled = false
    engine
      .load<ProjectsFile>(paths.projects, { merge: mergeProjects })
      .then((f) => {
        if (cancelled) return
        ref.current = f ?? emptyProjectsFile
        setFile(ref.current)
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      cancelled = true
    }
  }, [engine, paths])

  // Pick up merges after a conflict with another device.
  useEffect(
    () =>
      engine.subscribe(() => {
        const latest = engine.peek<ProjectsFile>(paths.projects)
        if (latest && ref.current && latest !== ref.current) {
          ref.current = latest
          setFile(latest)
        }
      }),
    [engine, paths],
  )

  const write = useCallback(
    (change: (projects: Record<string, Project>) => Record<string, Project>, immediate = false) => {
      const cur = ref.current ?? emptyProjectsFile
      const projects = change(cur.projects)
      if (projects === cur.projects) return
      const next: ProjectsFile = { version: 1, projects }
      ref.current = next
      setFile(next)
      engine.set(paths.projects, next, { merge: mergeProjects, immediate })
    },
    [engine, paths],
  )

  const value = useMemo<ProjectsContextValue>(() => {
    const all = Object.values(file?.projects ?? {}).filter((p) => !p.deletedAt)
    const byId = file?.projects ?? {}
    return {
      projects: all,
      get: (id) => (id ? byId[id] : undefined),
      projectName: (id) => (id ? byId[id]?.title : undefined),
      people: allPeople(all),
      create(input) {
        const project = createProject(input)
        write((ps) => ({ ...ps, [project.id]: project }), true)
        return project
      },
      update(id, patch) {
        write((ps) => {
          const p = ps[id]
          if (!p) return ps
          return { ...ps, [id]: patchProject(p, typeof patch === 'function' ? patch(p) : patch) }
        })
      },
      addNote(id, text) {
        const note = { id: createId(), at: new Date().toISOString(), text: text.trim() }
        if (!note.text) return
        write((ps) => {
          const p = ps[id]
          return p ? { ...ps, [id]: patchProject(p, { notes: [note, ...p.notes] }) } : ps
        })
      },
      markWorked(id, date) {
        write((ps) => {
          const p = ps[id]
          if (!p || p.workDates.includes(date)) return ps
          return { ...ps, [id]: { ...p, workDates: [...p.workDates, date].sort() } }
        })
      },
      remove(id) {
        write((ps) => {
          const p = ps[id]
          return p ? { ...ps, [id]: patchProject(p, { deletedAt: new Date().toISOString() }) } : ps
        })
      },
    }
  }, [file, write])

  if (error) {
    return (
      <p role="alert" style={{ color: 'var(--rose)' }}>
        Couldn't load projects: {error}
      </p>
    )
  }
  if (!file) return null
  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
}
