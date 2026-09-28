import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Shape } from '@/components/shapes/Shape'
import { CloseDayDialog } from '@/features/closeday/CloseDayDialog'
import { ClosingCelebration } from '@/features/closeday/ClosingCelebration'
import { DaySummaryCard } from '@/features/closeday/DaySummaryCard'
import { PlanList } from '@/features/planning/PlanList'
import { PlannedTotal } from '@/features/planning/PlannedTotal'
import { PlanYourDay } from '@/features/planning/PlanYourDay'
import {
  continuousWorkMs,
  dayState,
  openSegment,
  pause,
  reopenDay,
  segmentMs,
  setFocus,
  startBreak,
  startWork,
  totals,
} from '@/features/workday/day'
import { breakTypes } from '@/features/workday/types'
import { useWorkday } from '@/features/workday/WorkdayContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useNow } from '@/hooks/useNow'
import { formatClock, formatDuration } from '@/lib/time'
import { BreakNudge } from './components/BreakNudge'
import { ClockRing } from './components/ClockRing'
import { ControlBar } from './components/ControlBar'
import { FocusInput } from './components/FocusInput'
import { RecoveryDialog } from './components/RecoveryDialog'
import { Timeline } from './components/Timeline'
import { saveLastSeen } from './lastSeen'
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
  const breakLabel =
    open?.kind === 'break'
      ? `${breakTypes.find((b) => b.type === open.breakType)?.label ?? 'Short'} break`
      : undefined

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

      {state === 'working' && (
        <BreakNudge
          continuousMs={continuousWorkMs(today, now)}
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
    </div>
  )
}
