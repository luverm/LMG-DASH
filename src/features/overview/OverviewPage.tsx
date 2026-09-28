import { Card } from '@/components/ui/Card'
import styles from './OverviewPage.module.css'

export function OverviewPage() {
  return (
    <div className={styles.page}>
      <h1>Overview</h1>
      <div className={styles.grid}>
        <Card title="Getting started">
          <p>Add dashboard widgets under src/features/.</p>
        </Card>
      </div>
    </div>
  )
}
