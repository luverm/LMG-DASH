import { Card } from '@/components/ui/Card'
import { Shape } from '@/components/shapes/Shape'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { addPlanItem, finishPlanning, startWork } from '@/features/workday/day'
import type { DayRecord } from '@/features/workday/types'
import { useWorkday } from '@/features/workday/WorkdayContext'
import { formatDayLabel } from '@/lib/time'
import { PlanList } from './PlanList'
import { PlannedTotal } from './PlannedTotal'
import styles from './PlanYourDay.module.css'

function greeting(now: Date) {
  const h = now.getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

interface PlanYourDayProps {
  day: DayRecord
  previous: DayRecord | null
  now: Date
  projectName?: (id?: string) => string | undefined
}

/** Start-of-day panel: yesterday's note, carried-over items and today's plan. */
export function PlanYourDay({ day, previous, now, projectName }: PlanYourDayProps) {
  const { update } = useWorkday()
  const summary = previous?.summary
  const nextUp = summary?.next.trim()
  const alreadyAdded = nextUp && day.plan.some((i) => i.title === nextUp)

  return (
    <div className={styles.wrap}>
      <h1 className={styles.greeting}>{greeting(now)}! Let's plan your day.</h1>

      {summary && (nextUp || summary.blockers) && (
        <Card
          className={styles.resume}
          title={
            <>
              <Shape kind="square" size={18} /> Where you left off{' '}
              {formatDayLabel(previous.date).toLowerCase()}
            </>
          }
        >
          {nextUp && (
            <div className={styles.resumeRow}>
              <div>
                <div className={styles.resumeLabel}>Next up</div>
                <p className={styles.resumeText}>{nextUp}</p>
              </div>
              {!alreadyAdded && !nextUp.includes('\n') && (
                <ShapeButton
                  shape="hexagon"
                  size="sm"
                  onClick={() => update((d) => addPlanItem(d, { title: nextUp }))}
                >
                  Add to plan
                </ShapeButton>
              )}
            </div>
          )}
          {summary.blockers && (
            <div>
              <div className={styles.resumeLabel}>Blockers</div>
              <p className={styles.resumeText}>{summary.blockers}</p>
            </div>
          )}
        </Card>
      )}

      <Card
        title={
          <>
            <Shape kind="hexagon" size={18} /> Today's plan
          </>
        }
        actions={<PlannedTotal day={day} />}
      >
        <PlanList day={day} now={now} mode="planning" projectName={projectName} />
      </Card>

      <div className={styles.actions}>
        <ShapeButton
          shape="circle"
          variant="solid"
          size="lg"
          onClick={() => update((d, t) => startWork(finishPlanning(d), t))}
        >
          {day.plan.length ? 'Start my day' : 'Just start'}
        </ShapeButton>
        {day.plan.length > 0 && (
          <ShapeButton shape="square" variant="ghost" onClick={() => update(finishPlanning)}>
            Done planning, start later
          </ShapeButton>
        )}
      </div>
    </div>
  )
}
