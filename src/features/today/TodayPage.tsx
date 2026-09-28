import { useCallback, useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Shape } from '@/components/shapes/Shape'
import { CloseDayDialog } from '@/features/closeday/CloseDayDialog'
import { ClosingCelebration } from '@/features/closeday/ClosingCelebration'
import { DaySummaryCard } from '@/features/closeday/DaySummaryCard'
import { PlanList } from '@/features/planning/PlanList'
import { PlannedTotal } from '@/features/planning/PlannedTotal'
import { PlanYourDay } from '@/features/planning/PlanYourDay'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { EditBlocksDialog } from '@/features/editing/EditBlocksDialog'
import {
  continuousWorkMs,
  dayState,
  endFocusSession,
  focusBreak,
  focusWorkMs,
  openSegment,
  pause,
  reopenDay,
  replaceSegments,
  resolveAway,
  segmentMs,
  setFocus,
  setNotes,
  startBreak,
  startFocusSession,
  startWork,
  totals,
} from '@/features/workday/day'
import { breakLabel as labelForBreak, focusPresets } from '@/features/workday/types'
import { useWorkday } from '@/features/workday/WorkdayContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useNow } from '@/hooks/useNow'
import { useShortcuts } from '@/hooks/useShortcuts'
import { notify } from '@/lib/notify'
import { formatClock, formatDuration } from '@/lib/time'
import { BreakNudge } from './components/BreakNudge'
import { ClockRing } from './components/ClockRing'
import { AwayDialog } from './components/AwayDialog'
import { ControlBar } from './components/ControlBar'
import { FocusInput } from './components/FocusInput'
import { FocusTimer } from './components/FocusTimer'
import { RecoveryDialog } from './components/RecoveryDialog'
import { ScratchpadCard } from './components/ScratchpadCard'
import { Timeline } from './components/Timeline'
import { saveLastSeen } from './lastSeen'
import { useAwayDetection } from './useAwayDetection'
import styles from './TodayPage.module.css'

export function TodayPage({
  projectName = () => undefined,
}: {
  projectName?: (id?: string) => string | undefined
}) {
  const { today, settings, previous, recovery, update, resolveRecovery } = useWorkday()
  const state = dayState(today)
  const running = state === 'working' || state === 'break'
  const now = useNow(running)
  const [closing, setClosing] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const endCelebration = useCallback(() => setCelebrating(false), [setCelebrating])

  const { workMs, breakMs } = totals(today, now)
  const open = openSegment(today)
  const breakLabel = open?.kind === 'break' ? labelForBreak(open.breakType) : undefined
  const [editing, setEditing] = useState(false)
  const session = today.focusSession
  const focusMs = focusWorkMs(today, now)
  const focusBreakMs =
    session && open?.kind === 'break' && open.breakType === 'focus'
      ? segmentMs(open, now)
      : undefined
  const continuousMs = continuousWorkMs(today, now)
  const { away, clear: clearAway } = useAwayDetection(state === 'working', settings.awayMinutes)

  // Focus timer: start the break when a stretch is done; say when the break is over.
  const notified = useRef<string | null>(null)
  const notifyOnce = (key: string, title: string, body?: string) => {
    if (notified.current === key) return
    notified.current = key
    if (settings.notifications) notify(title, body)
  }
  useEffect(() => {
    if (!session) return
    if (state === 'working' && focusMs >= session.workMinutes * 60_000) {
      update(focusBreak)
      notifyOnce(
        `focus-${session.cycles}`,
        'Focus stretch done',
        `Take a ${session.breakMinutes} minute break.`,
      )
    } else if (focusBreakMs != null && focusBreakMs >= session.breakMinutes * 60_000) {
      notifyOnce(`break-${session.cycles}`, "Break's over", 'Ready for the next focus stretch?')
    }
  })
  useEffect(() => {
    if (state === 'working' && !session && continuousMs >= settings.nudgeAfterMinutes * 60_000) {
      notifyOnce(
        `nudge-${Math.floor(continuousMs / (settings.nudgeAfterMinutes * 60_000))}`,
        'Time for a break?',
        `You've been working for ${formatDuration(continuousMs)}.`,
      )
    }
  })

  const primary = () => {
    if (state === 'working') update(pause)
    else if (state !== 'closed') update(startWork)
  }
  useShortcuts({
    ' ': state === 'closed' ? undefined : primary,
    b:
      state === 'closed'
        ? undefined
        : () =>
            update((d, t) =>
              dayState(d) === 'break' ? startWork(d, t) : startBreak(d, t, 'coffee'),
            ),
    c: state === 'closed' || state === 'idle' ? undefined : () => setClosing(true),
    n: () => document.querySelector<HTMLInputElement>('input[aria-label="New plan item"]')?.focus(),
    f:
      state === 'closed'
        ? undefined
        : () =>
            update((d, t) =>
              d.focusSession
                ? endFocusSession(d)
                : startFocusSession(d, t, focusPresets[settings.focusPreset]),
            ),
    e: () => setEditing(true),
  })

  // The tab title shows the running time; lastSeen helps recover a forgotten clock.
  useDocumentTitle(
    state === 'working'
      ? `${formatClock(workMs)} · Working`
      : state === 'break' && open
        ? `${formatClock(segmentMs(open, now))} · Break`
        : null,
  )
  const minute = Math.floor(now.getTime() / 60_000)
  useEffect(() => {
    if (state === 'working') saveLastSeen()
  }, [state, minute])

  if (state === 'idle' && !today.planned) {
    return (
      <>
        {recovery && <RecoveryDialog day={recovery} onResolve={resolveRecovery} />}
        <PlanYourDay day={today} previous={previous} now={now} projectName={projectName} />
      </>
    )
  }

  const hasPlan = today.plan.some((i) => i.status !== 'dropped')

  return (
    <div className={styles.page}>
      {recovery && <RecoveryDialog day={recovery} onResolve={resolveRecovery} />}

      <section className={styles.hero}>
        <ClockRing
          state={state}
          workMs={workMs}
          targetMinutes={today.targetMinutes}
          breakMs={open?.kind === 'break' ? segmentMs(open, now) : undefined}
          breakLabel={breakLabel}
        />
        {state !== 'closed' && (
          <FocusInput
            focus={today.focus}
            projectName={projectName(today.focus?.projectId)}
            onChange={(focus) => update((d, t) => setFocus(d, t, focus))}
          />
        )}
        <ControlBar
          state={state}
          onStart={() => update(startWork)}
          onPause={() => update(pause)}
          onBreak={(type) => update((d, t) => startBreak(d, t, type))}
          onClose={() => setClosing(true)}
          onReopen={() => update(reopenDay)}
        />
        {state !== 'closed' && (
          <FocusTimer
            session={session}
            preset={settings.focusPreset}
            workMs={focusMs}
            breakMs={focusBreakMs}
            onStart={() =>
              update((d, t) => startFocusSession(d, t, focusPresets[settings.focusPreset]))
            }
            onEnd={() => update(endFocusSession)}
            onBackToWork={() => update(startWork)}
          />
        )}
      </section>

      {state === 'closed' && today.summary && <DaySummaryCard summary={today.summary} />}

      <Card
        title={
          <>
            <Shape kind="circle" size={18} /> Timeline
          </>
        }
        actions={
          <span className={styles.totals}>
            <span>
              <Shape kind="circle" size={12} filled /> {formatDuration(workMs)}
            </span>
            <span>
              <Shape kind="triangle" size={12} filled /> {formatDuration(breakMs)}
            </span>
            <ShapeButton shape="circle" size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </ShapeButton>
          </span>
        }
      >
        <Timeline day={today} now={now} />
      </Card>

      <Card
        title={
          <>
            <Shape kind="hexagon" size={18} /> Today's plan
          </>
        }
        actions={<PlannedTotal day={today} />}
      >
        {!hasPlan && <p className={styles.hint}>No plan today. Add something if it helps.</p>}
        <PlanList day={today} now={now} mode="day" projectName={projectName} />
      </Card>

      <ScratchpadCard notes={today.notes} onSave={(notes) => update((d) => setNotes(d, notes))} />

      {state === 'working' && !session && (
        <BreakNudge
          continuousMs={continuousMs}
          afterMinutes={settings.nudgeAfterMinutes}
          now={now}
          onBreak={(type) => update((d, t) => startBreak(d, t, type))}
        />
      )}

      {closing && (
        <CloseDayDialog
          day={today}
          projectName={projectName}
          onCancel={() => setClosing(false)}
          onClosed={() => {
            setClosing(false)
            setCelebrating(true)
          }}
        />
      )}
      {celebrating && <ClosingCelebration day={today} onDone={endCelebration} />}
      {editing && (
        <EditBlocksDialog
          day={today}
          onClose={() => setEditing(false)}
          onSave={(segments) => update((d) => replaceSegments(d, segments), { immediate: true })}
        />
      )}
      {away && (
        <AwayDialog
          from={away.from}
          to={away.to}
          onChoose={(choice) => {
            update((d) => resolveAway(d, away.from, away.to, choice))
            clearAway()
          }}
        />
      )}
    </div>
  )
}
