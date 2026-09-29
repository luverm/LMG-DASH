import { useState } from 'react'
import { Link } from 'react-router'
import { Shape } from '@/components/shapes/Shape'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { PhaseDots } from './components/PhaseTrack'
import { ScoreDots } from './components/ScorePicker'
import { useQuickCapture } from './QuickCaptureContext'
import {
  daysInStatus,
  defaultFilter,
  filterProjects,
  groupByStatus,
  needsFollowUp,
  type ProjectFilter,
} from './projects'
import { useProjects } from './ProjectsContext'
import { approaches, statuses, statusInfo } from './types'
import styles from './Projects.module.css'

export function ProjectsPage() {
  const { projects, people } = useProjects()
  const openCapture = useQuickCapture()
  const [filter, setFilter] = useState<ProjectFilter>(defaultFilter)
  const set = (patch: Partial<ProjectFilter>) => setFilter((f) => ({ ...f, ...patch }))
  const visible = filterProjects(projects, filter)
  const groups = groupByStatus(visible)
  const waiting = projects.filter((p) => !p.deletedAt && needsFollowUp(p))

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

          {waiting.length > 0 && (
            <button
              className={styles.followBanner}
              onClick={() => set({ status: 'feedback', person: '', approach: 'all', search: '' })}
            >
              <Shape kind="triangle" size={16} color="var(--peach)" filled />
              {waiting.length === 1
                ? `"${waiting[0].title}" has been waiting for feedback for over a week.`
                : `${waiting.length} projects have been waiting for feedback for over a week.`}{' '}
              <span>Show</span>
            </button>
          )}
          {groups.length === 0 && <p className={styles.muted}>Nothing matches these filters.</p>}
          {groups.map((g) => (
            <section key={g.value} className={styles.group}>
              <h2 className={styles.groupTitle} style={{ ['--c' as string]: g.color }}>
                <span className={styles.groupDot} aria-hidden />
                {g.label} <span className={styles.count}>{g.projects.length}</span>
              </h2>
              <ul className={styles.list}>
                {g.projects.map((p) => (
                  <li key={p.id}>
                    <Link to={`/projects/${p.id}`} className={styles.row}>
                      <Shape
                        kind="hexagon"
                        size={20}
                        color={statusInfo(p.status).color}
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
                      <span className={styles.rowPhase}>
                        <PhaseDots status={p.status} />
                        <span
                          className={`${styles.rowDate} ${needsFollowUp(p) ? styles.followUp : ''}`}
                        >
                          {needsFollowUp(p)
                            ? `Follow up · ${daysInStatus(p)}d`
                            : `${statusInfo(p.status).label} · ${daysInStatus(p) === 0 ? 'today' : `${daysInStatus(p)}d`}`}
                        </span>
                      </span>
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
