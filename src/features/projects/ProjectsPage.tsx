import { useState } from 'react'
import { Link } from 'react-router'
import { Shape } from '@/components/shapes/Shape'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { ScoreDots } from './components/ScorePicker'
import { useQuickCapture } from './QuickCaptureContext'
import { defaultFilter, filterProjects, groupByStatus, type ProjectFilter } from './projects'
import { useProjects } from './ProjectsContext'
import { approaches, statuses } from './types'
import styles from './Projects.module.css'

function relative(iso: string, now = Date.now()) {
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function ProjectsPage() {
  const { projects, people } = useProjects()
  const openCapture = useQuickCapture()
  const [filter, setFilter] = useState<ProjectFilter>(defaultFilter)
  const set = (patch: Partial<ProjectFilter>) => setFilter((f) => ({ ...f, ...patch }))
  const visible = filterProjects(projects, filter)
  const groups = groupByStatus(visible)

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>
          <Shape kind="hexagon" size={26} color="var(--butter)" /> Projects &amp; wishes
        </h1>
        <ShapeButton shape="hexagon" color="var(--butter)" variant="solid" onClick={openCapture}>
          New wish
        </ShapeButton>
      </header>

      {projects.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.honeycomb} aria-hidden>
            {[0, 1, 2].map((i) => (
              <Shape key={i} kind="hexagon" size={42} color="var(--butter)" />
            ))}
          </div>
          <p>
            When a coworker brings you a problem or an idea, note it here. You can fill in the
            details later.
          </p>
          <ShapeButton shape="hexagon" color="var(--butter)" onClick={openCapture}>
            Note the first wish
          </ShapeButton>
        </div>
      ) : (
        <>
          <div className={styles.filters}>
            <input
              className="input"
              type="search"
              placeholder="Search"
              aria-label="Search projects"
              value={filter.search}
              onChange={(e) => set({ search: e.target.value })}
            />
            <select
              className="input"
              aria-label="Status"
              value={filter.status}
              onChange={(e) => set({ status: e.target.value as ProjectFilter['status'] })}
            >
              <option value="active">Open</option>
              <option value="all">All</option>
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              className="input"
              aria-label="Person"
              value={filter.person}
              onChange={(e) => set({ person: e.target.value })}
            >
              <option value="">Everyone</option>
              {people.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              className="input"
              aria-label="Approach"
              value={filter.approach}
              onChange={(e) => set({ approach: e.target.value as ProjectFilter['approach'] })}
            >
              <option value="all">Any approach</option>
              {approaches.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <select
              className="input"
              aria-label="Sort"
              value={filter.sort}
              onChange={(e) => set({ sort: e.target.value as ProjectFilter['sort'] })}
            >
              <option value="updated">Recently updated</option>
              <option value="quickwins">Quick wins first</option>
            </select>
          </div>

          {groups.length === 0 && <p className={styles.muted}>Nothing matches these filters.</p>}
          {groups.map((g) => (
            <section key={g.value} className={styles.group}>
              <h2 className={styles.groupTitle}>
                {g.label} <span className={styles.count}>{g.projects.length}</span>
              </h2>
              <ul className={styles.list}>
                {g.projects.map((p) => (
                  <li key={p.id}>
                    <Link to={`/projects/${p.id}`} className={styles.row}>
                      <Shape
                        kind="hexagon"
                        size={20}
                        color="var(--butter)"
                        filled={p.status === 'delivered'}
                      />
                      <span className={styles.rowMain}>
                        <span className={styles.rowTitle}>{p.title}</span>
                        <span className={styles.rowMeta}>
                          {p.requestedBy.length > 0 && <span>{p.requestedBy.join(', ')}</span>}
                          {p.approach !== 'undecided' && (
                            <span className={styles.badge}>
                              {approaches.find((a) => a.value === p.approach)?.label}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className={styles.rowScores}>
                        <ScoreDots value={p.impact} title="Impact" />
                        <ScoreDots value={p.effort} title="Effort" />
                      </span>
                      <span className={styles.rowDate}>{relative(p.updatedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  )
}
