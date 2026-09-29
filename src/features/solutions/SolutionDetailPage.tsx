import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useToast } from '@/components/feedback/ToastContext'
import { Shape } from '@/components/shapes/Shape'
import { Card } from '@/components/ui/Card'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { ClaudeButton } from '@/features/claude/ClaudeButton'
import { download } from '@/features/export/exporters'
import { EditableText } from '@/features/projects/components/EditableText'
import { PeopleInput } from '@/features/projects/components/PeopleInput'
import { useProjects } from '@/features/projects/ProjectsContext'
import { createId } from '@/lib/time'
import { documentationPrompt, solutionMarkdown, userGuidePrompt } from './docs'
import { allTools } from './solutions'
import { useSolutions } from './SolutionsContext'
import { solutionStatuses, type Solution } from './types'
import styles from './Solutions.module.css'

const savedOptions = [15, 30, 60, 120, 240, 480]

export function SolutionDetailPage() {
  const { id } = useParams()
  const { get, update, remove, solutions } = useSolutions()
  const { projects, projectName, people } = useProjects()
  const toast = useToast()
  const navigate = useNavigate()
  const [link, setLink] = useState({ label: '', url: '' })
  const [pop, setPop] = useState(false)
  const s = get(id)

  if (!s || s.deletedAt) {
    return (
      <div className={styles.empty}>
        <p>This solution doesn't exist (anymore).</p>
        <Link to="/solutions">Back to solutions</Link>
      </div>
    )
  }
  const set = (patch: Partial<Solution>) => update(s.id, patch)
  const linkable = projects
    .filter((p) => !s.projectIds.includes(p.id))
    .sort((a, b) => a.title.localeCompare(b.title))

  function addLink() {
    const url = link.url.trim()
    if (!/^https?:\/\//i.test(url)) return toast('Links need to start with http:// or https://')
    set({ links: [...s!.links, { id: createId(), label: link.label.trim() || url, url }] })
    setLink({ label: '', url: '' })
  }

  const sections: {
    key: 'problem' | 'howItWorks' | 'usage' | 'maintenance'
    label: string
    hint: string
  }[] = [
    { key: 'problem', label: 'Problem', hint: 'What went wrong or took too long before?' },
    {
      key: 'howItWorks',
      label: 'How it works',
      hint: 'The flow, step by step. Which parts, triggers and data are involved?',
    },
    { key: 'usage', label: 'How to use it', hint: 'What do the people using it need to do?' },
    {
      key: 'maintenance',
      label: 'Maintenance',
      hint: 'Where does it run, what can break, how do you fix or update it? Accounts, keys, schedules…',
    },
  ]

  return (
    <div className={styles.page}>
      <Link to="/solutions" className={styles.back}>
        ← Solutions
      </Link>

      <header className={styles.detailHeader}>
        <span className={pop ? styles.pop : undefined} onAnimationEnd={() => setPop(false)}>
          <Shape kind="square" size={30} color="var(--lime)" filled={s.status === 'live'} />
        </span>
        <EditableText
          label="Name"
          hideLabel
          wrap
          value={s.title}
          className={styles.titleInput}
          onSave={(title) => title.trim() && set({ title: title.trim() })}
        />
      </header>

      <div className={styles.statusBar} role="radiogroup" aria-label="Status">
        {solutionStatuses.map((st) => (
          <button
            key={st.value}
            role="radio"
            aria-checked={s.status === st.value}
            className={s.status === st.value ? styles.statusActive : undefined}
            onClick={() => {
              if (st.value === s.status) return
              set({ status: st.value })
              if (st.value === 'live') setPop(true)
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <ClaudeButton
          prompt={() => documentationPrompt(s, projectName)}
          shape="square"
          color="var(--lime)"
        >
          Write docs with Claude
        </ClaudeButton>
        <ClaudeButton
          prompt={() => userGuidePrompt(s, projectName)}
          shape="square"
          color="var(--lime)"
        >
          User guide with Claude
        </ClaudeButton>
        <ShapeButton
          shape="square"
          size="sm"
          variant="ghost"
          color="var(--lime)"
          onClick={() =>
            download(
              `${
                s.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-|-$/g, '') || 'solution'
              }.md`,
              solutionMarkdown(s, projectName),
              'text/markdown',
            )
          }
        >
          Download .md
        </ShapeButton>
        <ShapeButton
          shape="triangle"
          size="sm"
          variant="ghost"
          color="var(--rose)"
          onClick={() => {
            if (confirm(`Delete "${s.title}"?`)) {
              remove(s.id)
              navigate('/solutions')
            }
          }}
        >
          Delete
        </ShapeButton>
      </div>

      <div className={styles.detailGrid}>
        <div className={styles.column}>
          <Card title="What it does">
            <EditableText
              label="Summary"
              hideLabel
              multiline
              rows={3}
              value={s.summary}
              placeholder="In one or two sentences, what does it do?"
              onSave={(summary) => set({ summary: summary.trim() || undefined })}
            />
          </Card>
          {sections.map((sec) => (
            <Card key={sec.key} title={sec.label}>
              <EditableText
                label={sec.label}
                hideLabel
                multiline
                rows={sec.key === 'howItWorks' ? 7 : 4}
                value={s[sec.key]}
                placeholder={sec.hint}
                onSave={(text) => set({ [sec.key]: text.trim() || undefined })}
              />
            </Card>
          ))}
        </div>

        <div className={styles.column}>
          <Card title="Details">
            <div className={styles.stack}>
              <PeopleInput
                key={`used-${s.id}`}
                label="Used by"
                value={s.usedBy}
                people={people}
                onChange={(usedBy) => set({ usedBy })}
              />
              <EditableText
                label="Team / department"
                value={s.team}
                onSave={(team) => set({ team: team.trim() || undefined })}
              />
              <PeopleInput
                key={`tools-${s.id}`}
                label="Tools & tech"
                placeholder="Power Automate, Python"
                value={s.tools}
                people={allTools(solutions)}
                onChange={(tools) => set({ tools })}
              />
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={s.usesAi}
                  onChange={(e) => set({ usesAi: e.target.checked })}
                />
                <span>Uses AI</span>
              </label>
              <label className="field">
                <span>Time saved per week (roughly)</span>
                <select
                  className="input"
                  value={s.savedMinutesPerWeek ?? ''}
                  onChange={(e) =>
                    set({
                      savedMinutesPerWeek: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                >
                  <option value="">Not sure</option>
                  {savedOptions.map((m) => (
                    <option key={m} value={m}>
                      {m < 60 ? `${m} minutes` : `${m / 60} hour${m === 60 ? '' : 's'}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Card>

          <Card title="Solves these requests">
            {s.projectIds.length > 0 && (
              <ul className={styles.linkedList}>
                {s.projectIds.map((pid) => (
                  <li key={pid}>
                    <Shape kind="hexagon" size={14} color="var(--butter)" />
                    {projectName(pid) ? (
                      <Link to={`/projects/${pid}`}>{projectName(pid)}</Link>
                    ) : (
                      <span className={styles.muted}>Deleted project</span>
                    )}
                    <button
                      className={styles.remove}
                      aria-label={`Unlink ${projectName(pid) ?? 'project'}`}
                      onClick={() => set({ projectIds: s.projectIds.filter((x) => x !== pid) })}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {linkable.length > 0 ? (
              <select
                className="input"
                aria-label="Link a project"
                value=""
                onChange={(e) =>
                  e.target.value && set({ projectIds: [...s.projectIds, e.target.value] })
                }
              >
                <option value="">Link a project or wish…</option>
                {linkable.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            ) : (
              s.projectIds.length === 0 && <p className={styles.muted}>No projects to link yet.</p>
            )}
          </Card>

          <Card title="Links">
            {s.links.length > 0 && (
              <ul className={styles.linkedList}>
                {s.links.map((l) => (
                  <li key={l.id}>
                    <a href={l.url} target="_blank" rel="noreferrer">
                      {l.label}
                    </a>
                    <button
                      className={styles.remove}
                      aria-label={`Remove link ${l.label}`}
                      onClick={() => set({ links: s.links.filter((x) => x.id !== l.id) })}
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
              <ShapeButton
                shape="square"
                size="sm"
                color="var(--lime)"
                type="submit"
                disabled={!link.url.trim()}
              >
                Add
              </ShapeButton>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
