import { daysInStatus } from '../projects'
import { phases, sideStatuses, statusInfo, type Project, type ProjectStatus } from '../types'
import styles from './PhaseTrack.module.css'

interface PhaseTrackProps {
  project: Project
  onChange(status: ProjectStatus): void
}

const dayText = (n: number) => (n === 0 ? 'since today' : n === 1 ? 'for 1 day' : `for ${n} days`)

/** The project's journey as steps: done, current (pulsing) and still to come. */
export function PhaseTrack({ project, onChange }: PhaseTrackProps) {
  const currentIndex = phases.findIndex((p) => p.value === project.status)
  const onSide = currentIndex === -1
  const info = statusInfo(project.status)
  const days = daysInStatus(project)

  return (
    <div className={`${styles.wrap} ${onSide ? styles.sidelined : ''}`}>
      <ol className={styles.track} role="radiogroup" aria-label="Phase">
        {phases.map((phase, i) => {
          const state = onSide
            ? 'future'
            : i < currentIndex
              ? 'done'
              : i === currentIndex
                ? 'current'
                : 'future'
          return (
            <li
              key={phase.value}
              className={`${styles.step} ${styles[state]}`}
              style={{ ['--c' as string]: phase.color }}
            >
              <button
                role="radio"
                aria-checked={state === 'current'}
                onClick={() => onChange(phase.value)}
                title={phase.hint}
              >
                <span className={styles.node} aria-hidden>
                  {state === 'done' && '✓'}
                </span>
                <span className={styles.label}>{phase.label}</span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className={styles.now} style={{ ['--c' as string]: info.color }}>
        <span className={styles.badge}>{info.label}</span>
        <span className={styles.days}>{dayText(days)}</span>
        <span className={styles.hint}>{info.hint}</span>
        <span className={styles.side}>
          {sideStatuses.map((s) => (
            <button
              key={s.value}
              className={project.status === s.value ? styles.sideActive : undefined}
              aria-pressed={project.status === s.value}
              onClick={() => onChange(project.status === s.value ? 'exploring' : s.value)}
              title={project.status === s.value ? 'Back to exploring' : s.hint}
            >
              {project.status === s.value
                ? `${s.label} · reopen`
                : s.label === 'Parked'
                  ? 'Park'
                  : 'Decline'}
            </button>
          ))}
        </span>
      </div>
    </div>
  )
}

/** A compact version for lists: one segment per phase, filled up to the current one. */
export function PhaseDots({ status }: { status: ProjectStatus }) {
  const index = phases.findIndex((p) => p.value === status)
  const info = statusInfo(status)
  return (
    <span className={styles.dots} title={info.label} aria-label={`Phase: ${info.label}`} role="img">
      {phases.map((p, i) => (
        <span
          key={p.value}
          className={index >= 0 && i <= index ? styles.dotOn : undefined}
          style={index >= 0 && i <= index ? { background: info.color } : undefined}
        />
      ))}
    </span>
  )
}
