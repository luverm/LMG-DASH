import { Card } from '@/components/ui/Card'
import { Shape } from '@/components/shapes/Shape'
import type { DaySummary } from '@/features/workday/types'
import styles from './CloseDay.module.css'

export function DaySummaryCard({
  summary,
  title = 'Your wrap-up',
}: {
  summary: DaySummary
  title?: string
}) {
  return (
    <Card
      title={
        <>
          <Shape kind="square" size={18} /> {title}
        </>
      }
      actions={
        summary.mood && (
          <Shape kind={summary.mood} size={20} filled title={`Mood: ${summary.mood}`} />
        )
      }
    >
      <dl className={styles.summary}>
        {summary.done && (
          <>
            <dt>Done</dt>
            <dd>{summary.done}</dd>
          </>
        )}
        {summary.next && (
          <>
            <dt>Next up</dt>
            <dd>{summary.next}</dd>
          </>
        )}
        {summary.blockers && (
          <>
            <dt>Blockers</dt>
            <dd>{summary.blockers}</dd>
          </>
        )}
      </dl>
    </Card>
  )
}
