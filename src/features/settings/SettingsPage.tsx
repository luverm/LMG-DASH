import { daysUntil } from '@/app/data/connection'
import { useData } from '@/app/data/DataContext'
import { Card } from '@/components/ui/Card'
import { Shape } from '@/components/shapes/Shape'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { useWorkday } from '@/features/workday/WorkdayContext'
import styles from './Settings.module.css'

export function SettingsPage() {
  const { mode, repoLabel, login, tokenExpiresAt, lock, disconnect, engine } = useData()
  const { settings, updateSettings, today, update } = useWorkday()
  const expiresIn = daysUntil(tokenExpiresAt)

  return (
    <div className={styles.page}>
      <h1>
        <Shape kind="square" size={24} /> Settings
      </h1>

      <Card title="Your day">
        <div className={styles.grid}>
          <label className="field">
            <span>Daily target (hours)</span>
            <input
              className="input"
              type="number"
              min={1}
              max={16}
              step={0.5}
              value={settings.targetMinutes / 60}
              onChange={(e) => {
                const minutes = Math.round(Number(e.target.value) * 60)
                if (minutes < 30 || minutes > 16 * 60) return
                updateSettings({ targetMinutes: minutes })
                if (today.status === 'active') update((d) => ({ ...d, targetMinutes: minutes }))
              }}
            />
          </label>
          <label className="field">
            <span>Suggest a break after (minutes of work)</span>
            <input
              className="input"
              type="number"
              min={15}
              max={240}
              step={5}
              value={settings.nudgeAfterMinutes}
              onChange={(e) => {
                const n = Number(e.target.value)
                if (n >= 15 && n <= 240) updateSettings({ nudgeAfterMinutes: n })
              }}
            />
          </label>
        </div>
      </Card>

      <Card title="Data">
        {mode === 'github' ? (
          <div className={styles.stack}>
            <p>
              Saved to <code>{repoLabel}</code> as <strong>{login}</strong>.
            </p>
            {tokenExpiresAt && (
              <p className={expiresIn !== null && expiresIn <= 14 ? styles.warn : undefined}>
                Token expires on {new Date(tokenExpiresAt).toLocaleDateString()}
                {expiresIn !== null && expiresIn >= 0 && ` (in ${expiresIn} days)`}. To replace it,
                forget this device and connect again with a new token.
              </p>
            )}
            <div className={styles.row}>
              <ShapeButton shape="square" onClick={lock}>
                Lock now
              </ShapeButton>
              <ShapeButton
                shape="triangle"
                variant="ghost"
                color="var(--rose)"
                onClick={async () => {
                  if (
                    confirm(
                      'Forget this device? Unsaved changes are saved first. Your data stays on GitHub.',
                    )
                  ) {
                    await engine.flush().catch(() => {})
                    disconnect()
                  }
                }}
              >
                Forget this device
              </ShapeButton>
            </div>
          </div>
        ) : (
          <div className={styles.stack}>
            <p>
              Your data is saved in this browser only. Connect a private GitHub repository to keep
              it safe and use it on other devices.
            </p>
            <div className={styles.row}>
              <ShapeButton
                shape="circle"
                onClick={() => {
                  if (
                    confirm(
                      'Switch to GitHub? Data from this browser is not copied over automatically.',
                    )
                  ) {
                    disconnect()
                  }
                }}
              >
                Connect GitHub
              </ShapeButton>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
