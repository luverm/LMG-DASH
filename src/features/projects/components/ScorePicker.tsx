import type { Score } from '../types'
import styles from '../Projects.module.css'

interface ScorePickerProps {
  label: string
  value?: Score
  onChange(v: Score | undefined): void
}

/** Three dots: low / medium / high. Clicking the current value clears it. */
export function ScorePicker({ label, value, onChange }: ScorePickerProps) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className={styles.score} role="radiogroup" aria-label={label}>
        {([1, 2, 3] as Score[]).map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={value === n}
            aria-label={`${label} ${['low', 'medium', 'high'][n - 1]}`}
            className={value && n <= value ? styles.scoreOn : ''}
            onClick={() => onChange(value === n ? undefined : n)}
          />
        ))}
        <span className={styles.scoreText}>
          {value ? ['Low', 'Medium', 'High'][value - 1] : '–'}
        </span>
      </div>
    </div>
  )
}

export function ScoreDots({ value, title }: { value?: Score; title: string }) {
  if (!value) return null
  return (
    <span className={styles.dots} title={`${title}: ${['low', 'medium', 'high'][value - 1]}`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= value ? styles.dotOn : undefined} />
      ))}
    </span>
  )
}
