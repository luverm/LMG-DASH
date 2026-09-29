import { createProject } from '@/features/projects/projects'
import { solutionMarkdown } from './docs'
import {
  createSolution,
  defaultSolutionFilter,
  filterSolutions,
  mergeSolutions,
  parseList,
  patchSolution,
  solutionFromProject,
  formatSaved,
  savingsSummary,
  totalSavedMinutesPerYear,
  yearlySavedMinutes,
} from './solutions'

describe('solutions', () => {
  it('drafts documentation from the project it came from', () => {
    const project = {
      ...createProject({
        title: 'Invoice export',
        requestedBy: ['Anna'],
        problem: 'Manual copying',
      }),
      wish: 'Automatic booking',
      approach: 'ai' as const,
      team: 'Finance',
    }
    const draft = createSolution(solutionFromProject(project))
    expect(draft).toMatchObject({
      title: 'Invoice export',
      usedBy: ['Anna'],
      team: 'Finance',
      usesAi: true,
      projectIds: [project.id],
      status: 'draft',
    })
    expect(draft.problem).toBe('Manual copying\n\nWish: Automatic booking')
  })

  it('stamps liveSince when going live and totals the time saved per year', () => {
    const live = patchSolution(createSolution({ title: 'A', savedMinutesPerWeek: 60 }), {
      status: 'live',
    })
    expect(live.liveSince).toBeDefined()
    const draft = createSolution({ title: 'B', savedMinutesPerWeek: 120 })
    // Old weekly-only data counts 52 times a year; drafts don't count.
    expect(totalSavedMinutesPerYear([live, draft])).toBe(60 * 52)

    const yearlyEvent = patchSolution(
      createSolution({ title: 'Event', savedMinutes: 16 * 60, savedPer: 'year' }),
      { status: 'live' },
    )
    const monthly = patchSolution(
      createSolution({ title: 'M', savedMinutes: 30, savedPer: 'month' }),
      {
        status: 'live',
      },
    )
    expect(yearlySavedMinutes(yearlyEvent)).toBe(16 * 60)
    expect(yearlySavedMinutes(monthly)).toBe(30 * 12)
    expect(formatSaved(yearlyEvent)).toBe('16h per year')
    expect(totalSavedMinutesPerYear([yearlyEvent, monthly])).toBe(16 * 60 + 360)
  })

  it('filters by status, tool and search text', () => {
    const a = createSolution({ title: 'Invoice flow', tools: ['Power Automate'], status: 'live' })
    const b = createSolution({
      title: 'HR bot',
      tools: ['Claude'],
      howItWorks: 'Answers leave questions',
    })
    expect(filterSolutions([a, b], { ...defaultSolutionFilter, status: 'live' })).toEqual([a])
    expect(filterSolutions([a, b], { ...defaultSolutionFilter, tool: 'claude' })).toEqual([b])
    expect(filterSolutions([a, b], { ...defaultSolutionFilter, search: 'leave' })).toEqual([b])
  })

  it('keeps the newest edit and all linked projects when merging', () => {
    const base = createSolution({ title: 'X' })
    const local = {
      version: 1 as const,
      solutions: {
        [base.id]: { ...base, title: 'Local', updatedAt: '2026-10-02', projectIds: ['p1'] },
      },
    }
    const remote = {
      version: 1 as const,
      solutions: {
        [base.id]: { ...base, title: 'Remote', updatedAt: '2026-10-01', projectIds: ['p2'] },
      },
    }
    const merged = mergeSolutions(local, remote).solutions[base.id]
    expect(merged.title).toBe('Local')
    expect(merged.projectIds.sort()).toEqual(['p1', 'p2'])
  })

  it('writes a Markdown document with only the filled-in sections', () => {
    const s = createSolution({
      title: 'Invoice flow',
      summary: 'Books invoices.',
      tools: ['Python'],
      howItWorks: 'Runs nightly.',
    })
    const md = solutionMarkdown(s, () => undefined)
    expect(md).toContain('# Invoice flow')
    expect(md).toContain('**Tools:** Python')
    expect(md).toContain('## How it works')
    expect(md).not.toContain('## Maintenance')
  })

  it('parses comma lists without duplicates', () => {
    expect(parseList('Python, python , Power Automate,')).toEqual(['Python', 'Power Automate'])
  })

  it('adds up every saving per year, showing the sum per solution', () => {
    const weekly = patchSolution(
      createSolution({ title: 'W', savedMinutes: 30, savedPer: 'week' }),
      { status: 'live' },
    )
    const monthly = createSolution({ title: 'M', savedMinutes: 180, savedPer: 'month' }) // in progress
    const yearly = patchSolution(
      createSolution({ title: 'Y', savedMinutes: 960, savedPer: 'year' }),
      { status: 'live' },
    )
    const retired = patchSolution(
      createSolution({ title: 'R', savedMinutes: 600, savedPer: 'year' }),
      { status: 'retired' },
    )
    const none = createSolution({ title: 'N' })

    const summary = savingsSummary([weekly, monthly, yearly, retired, none])
    expect(summary.rows.map((r) => [r.solution.title, r.factor, r.yearly])).toEqual([
      ['M', 12, 2160],
      ['W', 52, 1560],
      ['Y', 1, 960],
    ])
    expect(summary.live).toBe(1560 + 960)
    expect(summary.inProgress).toBe(2160)
    expect(summary.total).toBe(1560 + 960 + 2160)
  })
})
