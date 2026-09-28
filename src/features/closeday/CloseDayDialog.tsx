import { useMemo, useState } from 'react'
import { Shape } from '@/components/shapes/Shape'
import type { ShapeKind } from '@/components/shapes/shapes'
import { Dialog } from '@/components/ui/Dialog'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { ClaudeButton } from '@/features/claude/ClaudeButton'
import { polishSummaryPrompt } from '@/features/claude/prompts'
import { Timeline } from '@/features/today/components/Timeline'
import { closeDay, totals } from '@/features/workday/day'
import type { DayRecord, Mood, PlanDecision } from '@/features/workday/types'
import { useWorkday } from '@/features/workday/WorkdayContext'
import { formatDuration } from '@/lib/time'
import { draftDone, draftNext } from './draft'
import styles from './CloseDay.module.css'

const moods: { shape: ShapeKind; label: string }[] = [
  { shape: 'circle', label: 'Smooth' },
  { shape: 'hexagon', label: 'Productive' },
  { shape: 'square', label: 'Steady' },
  { shape: 'triangle', label: 'Rough' },
]

const decisionLabels: Record<PlanDecision, string> = {
  done: 'Done',
  carry: 'Carry over',
  drop: 'Drop',
}

interface CloseDayDialogProps {
  day: DayRecord
  onCancel(): void
  onClosed(): void
  projectName?: (id?: string) => string | undefined
}

export function CloseDayDialog({ day, onCancel, onClosed, projectName }: CloseDayDialogProps) {
  const { update } = useWorkday()
  const [now] = useState(() => new Date())
  const openItems = day.plan.filter((i) => i.status === 'open')
  const [decisions, setDecisions] = useState<Record<string, PlanDecision>>(() =>
    Object.fromEntries(openItems.map((i) => [i.id, 'carry' as PlanDecision])),
  )
  const [done, setDone] = useState<string | null>(null)
  const [next, setNext] = useState<string | null>(null)
  const [blockers, setBlockers] = useState(day.summary?.blockers ?? '')
  const [mood, setMood] = useState<Mood | undefined>(day.summary?.mood)

  // Drafts follow the plan decisions until the user edits the text.
  const doneDraft = useMemo(
    () => day.summary?.done ?? draftDone(day, now, decisions, projectName),
    [day, now, decisions, projectName],
  )
  const nextDraft = useMemo(() => day.summary?.next ?? draftNext(day, decisions), [day, decisions])
  const { workMs, breakMs } = totals(day, now)

  function save() {
    update(
      (d, t) =>
        closeDay(
          d,
          t,
          {
            done: (done ?? doneDraft).trim(),
            next: (next ?? nextDraft).trim(),
            blockers: blockers.trim() || undefined,
            mood,
          },
          decisions,
        ),
      { immediate: true },
    )
    onClosed()
  }

  return (
    <Dialog
      title="Close your workday"
      shape="square"
      wide
      onClose={onCancel}
      footer={
        <>
          <ClaudeButton
            shape="square"
            prompt={() =>
              polishSummaryPrompt(
                day,
                now,
                { done: done ?? doneDraft, next: next ?? nextDraft, blockers },
                projectName ?? (() => undefined),
              )
            }
          >
            Polish with Claude
          </ClaudeButton>
          <span style={{ flex: 1 }} />
          <ShapeButton shape="triangle" variant="ghost" onClick={onCancel}>
            Not yet
          </ShapeButton>
          <ShapeButton shape="square" variant="solid" onClick={save}>
            Close day
          </ShapeButton>
        </>
      }
    >
      <div className={styles.stats}>
        <span>
          <Shape kind="circle" size={14} filled /> {formatDuration(workMs)} worked
        </span>
        <span>
          <Shape kind="triangle" size={14} filled /> {formatDuration(breakMs)} breaks
        </span>
      </div>
      <Timeline day={day} now={now} />

      {openItems.length > 0 && (
        <section className={styles.section}>
          <h3>Plan review</h3>
          <ul className={styles.review}>
            {openItems.map((item) => (
              <li key={item.id}>
                <span className={styles.itemTitle}>{item.title}</span>
                <div className={styles.segmented} role="radiogroup" aria-label={item.title}>
                  {(Object.keys(decisionLabels) as PlanDecision[]).map((d) => (
                    <button
                      key={d}
                      role="radio"
                      aria-checked={decisions[item.id] === d}
                      className={decisions[item.id] === d ? styles.selected : ''}
                      onClick={() => setDecisions((cur) => ({ ...cur, [item.id]: d }))}
                    >
                      {decisionLabels[d]}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        {day.notes && (
          <div className="field">
            <span>Your scratchpad</span>
            <p className={styles.notes}>{day.notes}</p>
          </div>
        )}
        <label className="field">
          <span>Done today</span>
          <textarea
            className="input"
            rows={5}
            value={done ?? doneDraft}
            onChange={(e) => setDone(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Next up (where to pick up tomorrow)</span>
          <textarea
            className="input"
            rows={3}
            value={next ?? nextDraft}
            onChange={(e) => setNext(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Blockers (optional)</span>
          <textarea
            className="input"
            rows={2}
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
          />
        </label>
        <div className="field">
          <span>How did it go?</span>
          <div className={styles.moods} role="radiogroup" aria-label="Mood">
            {moods.map((m) => (
              <button
                key={m.shape}
                role="radio"
                aria-checked={mood === m.shape}
                className={`${styles.mood} ${mood === m.shape ? styles.moodActive : ''}`}
                onClick={() => setMood(mood === m.shape ? undefined : m.shape)}
              >
                <Shape kind={m.shape} size={22} filled={mood === m.shape} />
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </Dialog>
  )
}
