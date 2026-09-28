import { useSyncStatus } from '@/app/data/DataContext'
import styles from './SaveIndicator.module.css'

const labels = {
  saved: 'Saved',
  saving: 'Saving…',
  offline: 'Offline, will retry',
  error: "Couldn't save",
} as const

export function SaveIndicator() {
  const { status, error } = useSyncStatus()
  return (
    <span
      className={`${styles.indicator} ${styles[status]}`}
      role="status"
      title={error ?? labels[status]}
    >
      <span className={styles.dot} aria-hidden />
      <span className={styles.label}>{labels[status]}</span>
    </span>
  )
}
