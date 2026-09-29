import { Link } from 'react-router'
import { Card } from '@/components/ui/Card'
import { Shape } from '@/components/shapes/Shape'
import { formatMinutes } from '@/lib/time'
import type { SavingsSummary } from '../solutions'
import { savedPeriods, solutionStatuses } from '../types'
import styles from './SavingsCard.module.css'

const WORKDAY_MINUTES = 8 * 60

const periodLabel = (per: string) => savedPeriods.find((p) => p.value === per)?.label ?? ''
const statusLabel = (status: string) =>
  solutionStatuses.find((s) => s.value === status)?.label ?? status

/** The sum behind "saved per year": each solution's saving, how often it happens, and the total. */
export function SavingsCard({ summary }: { summary: SavingsSummary }) {
  const { rows, live, inProgress, total } = summary
  if (rows.length === 0) return null
  const max = rows[0].yearly || 1

  return (
    <Card
      title={
        <>
          <Shape kind="square" size={18} color="var(--lime)" filled /> Time saved
        </>
      }
    >
      <div className={styles.headline}>
        <div>
          <span className={styles.big}>{formatMinutes(total)}</span>
          <span className={styles.label}>per year in total</span>
        </div>
        <div className={styles.equivalents}>
          <span>≈ {formatMinutes(Math.round(total / 12))} per month</span>
          <span>≈ {formatMinutes(Math.round(total / 52))} per week</span>
          <span>≈ {(total / WORKDAY_MINUTES).toFixed(1).replace('.0', '')} workdays per year</span>
        </div>
      </div>

      <table className={styles.table}>
        <caption className="visually-hidden">How the yearly total is calculated</caption>
        <thead>
          <tr>
            <th scope="col">Solution</th>
            <th scope="col">Saves</th>
            <th scope="col" className={styles.num}>
              Times a year
            </th>
            <th scope="col" className={styles.num}>
              Per year
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.solution.id}>
              <th scope="row">
                <Link to={`/solutions/${r.solution.id}`}>{r.solution.title}</Link>
                {r.solution.status !== 'live' && (
                  <span className={styles.tag}>{statusLabel(r.solution.status)}</span>
                )}
                <span className={styles.bar} aria-hidden>
                  <span
                    style={{ width: `${(r.yearly / max) * 100}%` }}
                    className={r.solution.status === 'live' ? styles.barLive : undefined}
                  />
                </span>
              </th>
              <td>
                {formatMinutes(r.minutes)} {periodLabel(r.per)}
              </td>
              <td className={styles.num}>× {r.factor}</td>
              <td className={`${styles.num} ${styles.strong}`}>= {formatMinutes(r.yearly)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {inProgress > 0 && (
            <>
              <tr>
                <th scope="row" colSpan={3}>
                  Live
                </th>
                <td className={styles.num}>{formatMinutes(live)}</td>
              </tr>
              <tr>
                <th scope="row" colSpan={3}>
                  In progress (expected)
                </th>
                <td className={styles.num}>{formatMinutes(inProgress)}</td>
              </tr>
            </>
          )}
          <tr className={styles.totalRow}>
            <th scope="row" colSpan={3}>
              Total per year
            </th>
            <td className={styles.num}>{formatMinutes(total)}</td>
          </tr>
        </tfoot>
      </table>
    </Card>
  )
}
