import {
  createProject,
  defaultFilter,
  filterProjects,
  mergeProjects,
  parsePeople,
  patchProject,
} from './projects'
import type { Project, ProjectsFile } from './types'

const t = (iso: string) => new Date(`2026-09-${iso}Z`)

function project(title: string, patch: Partial<Project> = {}): Project {
  return { ...createProject({ title, now: t('01T10:00:00') }), ...patch }
}

describe('parsePeople', () => {
  it('splits, trims and de-duplicates names', () => {
    expect(parsePeople(' Anna, bram ,anna,, Bram ')).toEqual(['Anna', 'bram'])
  })
})

describe('patchProject', () => {
  it('stamps deliveredAt when delivered and clears it when moved back', () => {
    const p = project('X')
    const delivered = patchProject(p, { status: 'delivered' }, t('02T10:00:00'))
    expect(delivered.deliveredAt).toBe('2026-09-02T10:00:00.000Z')
    expect(patchProject(delivered, { status: 'building' }).deliveredAt).toBeUndefined()
  })
})

describe('filterProjects', () => {
  const list = [
    project('Invoice export', { requestedBy: ['Anna'], impact: 3, effort: 1, updatedAt: '1' }),
    project('Chatbot for HR', {
      requestedBy: ['Bram'],
      approach: 'ai',
      impact: 2,
      effort: 3,
      updatedAt: '3',
    }),
    project('Old thing', { status: 'delivered', updatedAt: '2' }),
    project('Removed', { deletedAt: 'x' }),
  ]

  it('shows open projects, newest first, by default', () => {
    expect(filterProjects(list, defaultFilter).map((p) => p.title)).toEqual([
      'Chatbot for HR',
      'Invoice export',
    ])
  })

  it('filters by person, approach and search, and sorts quick wins first', () => {
    expect(filterProjects(list, { ...defaultFilter, person: 'anna' }).map((p) => p.title)).toEqual([
      'Invoice export',
    ])
    expect(filterProjects(list, { ...defaultFilter, approach: 'ai' })).toHaveLength(1)
    expect(filterProjects(list, { ...defaultFilter, status: 'all', search: 'old' })).toHaveLength(1)
    expect(
      filterProjects(list, { ...defaultFilter, sort: 'quickwins' }).map((p) => p.title),
    ).toEqual(['Invoice export', 'Chatbot for HR'])
  })
})

describe('mergeProjects', () => {
  it('keeps the newer edit but all notes and work dates from both sides', () => {
    const base = project('P')
    const note = (id: string, at: string) => ({ id, at, text: id })
    const local: ProjectsFile = {
      version: 1,
      projects: {
        [base.id]: {
          ...base,
          title: 'Local title',
          updatedAt: '2026-09-03',
          notes: [note('a', '2026-09-03')],
          workDates: ['2026-09-03'],
        },
      },
    }
    const remote: ProjectsFile = {
      version: 1,
      projects: {
        [base.id]: {
          ...base,
          title: 'Remote title',
          updatedAt: '2026-09-02',
          notes: [note('b', '2026-09-02')],
          workDates: ['2026-09-02'],
        },
        other: project('Other', { id: 'other' }),
      },
    }
    const merged = mergeProjects(local, remote)
    expect(merged.projects[base.id].title).toBe('Local title')
    expect(merged.projects[base.id].notes.map((n) => n.id)).toEqual(['a', 'b'])
    expect(merged.projects[base.id].workDates).toEqual(['2026-09-02', '2026-09-03'])
    expect(merged.projects.other.title).toBe('Other')
  })
})
