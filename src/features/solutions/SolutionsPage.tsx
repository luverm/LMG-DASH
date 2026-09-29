import { useState } from 'react'
import { Link } from 'react-router'
import { Shape } from '@/components/shapes/Shape'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { download } from '@/features/export/exporters'
import { useProjects } from '@/features/projects/ProjectsContext'
import { formatMinutes } from '@/lib/time'
import { NewSolutionDialog } from './components/NewSolutionDialog'
import { catalogueMarkdown } from './docs'
import {
  allTools,
  defaultSolutionFilter,
  filterSolutions,
  formatSaved,
  totalSavedMinutesPerYear,
  type SolutionFilter,
} from './solutions'
import { useSolutions } from './SolutionsContext'
import { solutionStatuses } from './types'
import styles from './Solutions.module.css'

export function SolutionsPage() {
  const { solutions } = useSolutions()
  const { projectName } = useProjects()
  const [filter, setFilter] = useState<SolutionFilter>(defaultSolutionFilter)
  const [creating, setCreating] = useState(false)
  const set = (patch: Partial<SolutionFilter>) => setFilter((f) => ({ ...f, ...patch }))
  const visible = filterSolutions(solutions, filter)
  const tools = allTools(solutions)
  const saved = totalSavedMinutesPerYear(solutions)
  const live = solutions.filter((s) => s.status === 'live').length

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>
          <Shape kind="square" size={24} color="var(--lime)" /> Solutions
        </h1>
        <div className={styles.headerActions}>
          {solutions.length > 0 && (
            <ShapeButton
              shape="square"
              color="var(--lime)"
              variant="ghost"
              onClick={() =>
                download('solutions.md', catalogueMarkdown(visible, projectName), 'text/markdown')
              }
            >
              Export
            </ShapeButton>
          )}
          <ShapeButton
            shape="square"
            color="var(--lime)"
            variant="solid"
            onClick={() => setCreating(true)}
          >
            New solution
          </ShapeButton>
        </div>
      </header>

      {solutions.length > 0 && (
        <div className={styles.stats}>
          <div>
            <span className={styles.statValue}>{live}</span>
            <span className={styles.statLabel}>live</span>
          </div>
          <div>
            <span className={styles.statValue}>{solutions.length}</span>
            <span className={styles.statLabel}>documented</span>
          </div>
          {saved > 0 && (
            <div>
              <span className={styles.statValue}>{formatMinutes(saved)}</span>
              <span className={styles.statLabel}>saved per year</span>
            </div>
          )}
        </div>
      )}

      {solutions.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.blocks} aria-hidden>
            {[0, 1, 2].map((i) => (
              <Shape key={i} kind="square" size={38} color="var(--lime)" filled={i === 1} />
            ))}
          </div>
          <p>
            Document what you've built: what it does, how it works, who uses it and how to keep it
            running. Future you will be grateful.
          </p>
          <ShapeButton shape="square" color="var(--lime)" onClick={() => setCreating(true)}>
            Document the first solution
          </ShapeButton>
        </div>
      ) : (
        <>
          <div className={styles.filters}>
            <input
              className="input"
              type="search"
              placeholder="Search"
              aria-label="Search solutions"
              value={filter.search}
              onChange={(e) => set({ search: e.target.value })}
            />
            <select
              className="input"
              aria-label="Status"
              value={filter.status}
              onChange={(e) => set({ status: e.target.value as SolutionFilter['status'] })}
            >
              <option value="all">Any status</option>
              {solutionStatuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              className="input"
              aria-label="Tool"
              value={filter.tool}
              onChange={(e) => set({ tool: e.target.value })}
            >
              <option value="">Any tool</option>
              {tools.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {visible.length === 0 && <p className={styles.muted}>Nothing matches these filters.</p>}
          <ul className={styles.grid}>
            {visible.map((s) => (
              <li key={s.id}>
                <Link to={`/solutions/${s.id}`} className={styles.card}>
                  <span className={styles.cardTop}>
                    <Shape
                      kind="square"
                      size={18}
                      color="var(--lime)"
                      filled={s.status === 'live'}
                    />
                    <span className={`${styles.status} ${styles[s.status]}`}>
                      {solutionStatuses.find((x) => x.value === s.status)?.label}
                    </span>
                    {s.usesAi && <span className={styles.ai}>AI</span>}
                  </span>
                  <span className={styles.cardTitle}>{s.title}</span>
                  {s.summary && <span className={styles.cardSummary}>{s.summary}</span>}
                  <span className={styles.cardMeta}>
                    {s.tools.slice(0, 4).map((t) => (
                      <span key={t} className={styles.tool}>
                        {t}
                      </span>
                    ))}
                    {formatSaved(s) && <span className={styles.saved}>~{formatSaved(s)}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      {creating && <NewSolutionDialog onClose={() => setCreating(false)} />}
    </div>
  )
}
