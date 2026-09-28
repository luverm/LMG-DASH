import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useToast } from '@/components/feedback/ToastContext'
import { Shape } from '@/components/shapes/Shape'
import { Card } from '@/components/ui/Card'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { ClaudeButton } from '@/features/claude/ClaudeButton'
import { brainstormPrompt, requesterUpdatePrompt } from '@/features/claude/prompts'
import { addPlanItem } from '@/features/workday/day'
import { useWorkday } from '@/features/workday/WorkdayContext'
import { createId, formatDayLabel, formatDuration } from '@/lib/time'
import { EditableText } from './components/EditableText'
import { PeopleInput } from './components/PeopleInput'
import { ScorePicker } from './components/ScorePicker'
import { useProjects } from './ProjectsContext'
import { approaches, statuses, type Approach, type ProjectStatus } from './types'
import { useProjectTime } from './useProjectTime'
import styles from './Projects.module.css'

export function ProjectDetailPage() {
  const { id } = useParams()
  const { get, update, addNote, remove, people } = useProjects()
  const { today, update: updateDay } = useWorkday()
  const toast = useToast()
  const navigate = useNavigate()
  const project = get(id)
  const [note, setNote] = useState('')
  const [link, setLink] = useState({ label: '', url: '' })
  const [celebrate, setCelebrate] = useState(false)
  const time = useProjectTime(project?.id ?? '', project?.workDates ?? [])

  if (!project || project.deletedAt) {
    return (
      <div className={styles.empty}>
        <p>This project doesn't exist (anymore).</p>
        <Link to="/projects">Back to projects</Link>
      </div>
    )
  }
  const p = project
  const set = (patch: Parameters<typeof update>[1]) => update(p.id, patch)
  const inPlan = today.plan.some((i) => i.projectId === p.id && i.status === 'open')

  function setStatus(status: ProjectStatus) {
    if (status === p.status) return
    set({ status })
    if (status === 'delivered') setCelebrate(true)
  }

  function addLink() {
    const url = link.url.trim()
    if (!/^https?:\/\//i.test(url)) return toast('Links need to start with http:// or https://')
    set({ links: [...p.links, { id: createId(), label: link.label.trim() || url, url }] })
    setLink({ label: '', url: '' })
  }

  return (
    <div className={styles.page}>
      <Link to="/projects" className={styles.back}>
        ← Projects
      </Link>

      <header className={styles.detailHeader}>
        <span
          className={celebrate ? styles.celebrate : undefined}
          onAnimationEnd={() => setCelebrate(false)}
        >
          <Shape kind="hexagon" size={34} color="var(--butter)" filled={p.status === 'delivered'} />
        </span>
        <EditableText
          label="Title"
          hideLabel
          value={p.title}
          className={styles.titleInput}
          onSave={(title) => title.trim() && set({ title: title.trim() })}
        />
      </header>

      <div className={styles.pipeline} role="radiogroup" aria-label="Status">
        {statuses.map((s) => (
          <button
            key={s.value}
            role="radio"
            aria-checked={p.status === s.value}
            className={p.status === s.value ? styles.stageActive : undefined}
            onClick={() => setStatus(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={styles.detailGrid}>
        <div className={styles.column}>
          <Card title="The ask">
            <div className={styles.stack}>
              <EditableText
                label="Problem: what hurts today?"
                multiline
                value={p.problem}
                onSave={(problem) => set({ problem: problem.trim() || undefined })}
              />
              <EditableText
                label="Wish: what would they like to happen?"
                multiline
                value={p.wish}
                onSave={(wish) => set({ wish: wish.trim() || undefined })}
              />
            </div>
          </Card>

          <Card title="Notes">
            <form
              className={styles.noteForm}
              onSubmit={(e) => {
                e.preventDefault()
                addNote(p.id, note)
                setNote('')
              }}
            >
              <textarea
                className="input"
                rows={2}
                value={note}
                placeholder="Talked to Anna, she also needs CSV export…"
                aria-label="New note"
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey))
                    e.currentTarget.form?.requestSubmit()
                }}
              />
              <ShapeButton
                shape="hexagon"
                color="var(--butter)"
                type="submit"
                disabled={!note.trim()}
              >
                Add note
              </ShapeButton>
            </form>
            {p.notes.length > 0 && (
              <ol className={styles.notes}>
                {p.notes.map((n) => (
                  <li key={n.id}>
                    <time dateTime={n.at}>
                      {new Date(n.at).toLocaleString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                    <p>{n.text}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className={styles.column}>
          <Card title="Details">
            <div className={styles.stack}>
              <PeopleInput
                key={p.id}
                label="Requested by"
                value={p.requestedBy}
                people={people}
                onChange={(requestedBy) => set({ requestedBy })}
              />
              <EditableText
                label="Team / department"
                value={p.team}
                onSave={(team) => set({ team: team.trim() || undefined })}
              />
              <label className="field">
                <span>Approach</span>
                <select
                  className="input"
                  value={p.approach}
                  onChange={(e) => set({ approach: e.target.value as Approach })}
                >
                  {approaches.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.scores}>
                <ScorePicker
                  label="Impact"
                  value={p.impact}
                  onChange={(impact) => set({ impact })}
                />
                <ScorePicker
                  label="Effort"
                  value={p.effort}
                  onChange={(effort) => set({ effort })}
                />
              </div>
            </div>
          </Card>

          <Card title="Links">
            {p.links.length > 0 && (
              <ul className={styles.links}>
                {p.links.map((l) => (
                  <li key={l.id}>
                    <a href={l.url} target="_blank" rel="noreferrer">
                      {l.label}
                    </a>
                    <button
                      className={styles.remove}
                      aria-label={`Remove link ${l.label}`}
                      onClick={() => set({ links: p.links.filter((x) => x.id !== l.id) })}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form
              className={styles.linkForm}
              onSubmit={(e) => {
                e.preventDefault()
                addLink()
              }}
            >
              <input
                className="input"
                placeholder="Label"
                aria-label="Link label"
                value={link.label}
                onChange={(e) => setLink({ ...link, label: e.target.value })}
              />
              <input
                className="input"
                placeholder="https://…"
                aria-label="Link URL"
                value={link.url}
                onChange={(e) => setLink({ ...link, url: e.target.value })}
              />
              <ShapeButton shape="square" size="sm" type="submit" disabled={!link.url.trim()}>
                Add
              </ShapeButton>
            </form>
          </Card>

          <Card title="Time">
            <p className={styles.timeTotal}>
              <Shape kind="circle" size={16} filled /> {formatDuration(time.totalMs)} tracked
              {time.loading && <span className={styles.muted}> (loading…)</span>}
            </p>
            {time.byDate.length > 0 && (
              <ul className={styles.timeList}>
                {time.byDate.slice(0, 8).map((d) => (
                  <li key={d.date}>
                    <span>{formatDayLabel(d.date)}</span>
                    <span className="tabular">{formatDuration(d.ms)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className={styles.actions}>
            <ShapeButton
              shape="hexagon"
              disabled={inPlan || today.status === 'closed'}
              onClick={() => {
                updateDay((d) => addPlanItem(d, { title: p.title, projectId: p.id }))
                toast("Added to today's plan")
              }}
            >
              {inPlan ? "In today's plan" : "Add to today's plan"}
            </ShapeButton>
            <ClaudeButton prompt={() => brainstormPrompt(p)}>Brainstorm with Claude</ClaudeButton>
            <ClaudeButton prompt={() => requesterUpdatePrompt(p)} shape="square">
              Draft an update
            </ClaudeButton>
            <ShapeButton
              shape="triangle"
              variant="ghost"
              size="sm"
              color="var(--rose)"
              onClick={() => {
                if (confirm(`Delete "${p.title}"?`)) {
                  remove(p.id)
                  navigate('/projects')
                }
              }}
            >
              Delete
            </ShapeButton>
          </div>
        </div>
      </div>
    </div>
  )
}
