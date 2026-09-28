import { daysUntil } from '@/app/data/connection'
import { useData } from '@/app/data/DataContext'
import { Card } from '@/components/ui/Card'
import { Shape } from '@/components/shapes/Shape'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { useToast } from '@/components/feedback/ToastContext'
import { ShortcutList } from '@/components/layout/ShortcutList'
import { routineItems } from '@/features/workday/day'
import type { FocusPreset } from '@/features/workday/types'
import { useWorkday } from '@/features/workday/WorkdayContext'
import { notificationsSupported, requestNotifications } from '@/lib/notify'
import { ExportSection } from './ExportSection'
import { RoutinesEditor } from './RoutinesEditor'
import styles from './Settings.module.css'

export function SettingsPage() {
  const { mode, repoLabel, login, tokenExpiresAt, lock, disconnect, engine } = useData()
  const { settings, updateSettings, today, update } = useWorkday()
  const expiresIn = daysUntil(tokenExpiresAt)
  const toast = useToast()

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

      <Card title="Focus & breaks">
        <div className={styles.grid}>
          <label className="field">
            <span>Focus timer</span>
            <select
              className="input"
              value={settings.focusPreset}
              onChange={(e) => updateSettings({ focusPreset: e.target.value as FocusPreset })}
            >
              <option value="25/5">25 min focus, 5 min break</option>
              <option value="50/10">50 min focus, 10 min break</option>
            </select>
          </label>
          <label className="field">
            <span>Ask about time away (desktop)</span>
            <select
              className="input"
              value={settings.awayMinutes}
              onChange={(e) => updateSettings({ awayMinutes: Number(e.target.value) })}
            >
              <option value={0}>Off</option>
              <option value={15}>After 15 minutes</option>
              <option value={30}>After 30 minutes</option>
              <option value={60}>After 1 hour</option>
            </select>
          </label>
        </div>
        <div className={styles.notify}>
          <div>
            <strong>Notifications</strong>
            <p className={styles.muted}>
              {notificationsSupported()
                ? 'A system notification for break reminders and the focus timer while the app is in the background.'
                : "This browser doesn't support notifications here. On iPhone, add the app to your home screen first."}
            </p>
          </div>
          {notificationsSupported() && (
            <ShapeButton
              shape="triangle"
              variant={settings.notifications ? 'soft' : 'ghost'}
              onClick={async () => {
                if (settings.notifications) return updateSettings({ notifications: false })
                const ok = await requestNotifications()
                updateSettings({ notifications: ok })
                if (!ok) toast('Notifications are blocked in your browser settings.')
              }}
            >
              {settings.notifications ? 'On' : 'Turn on'}
            </ShapeButton>
          )}
        </div>
      </Card>

      <Card title="Routines">
        <RoutinesEditor
          routines={settings.routines}
          onChange={(routines, added) => {
            updateSettings({ routines })
            // A new routine that's due today goes straight into today's plan.
            if (added && today.status === 'active') {
              const [item] = routineItems(today.date, { ...settings, routines: [added] })
              if (item) update((d) => ({ ...d, plan: [...d.plan, item] }))
            }
          }}
        />
      </Card>

      <Card title="Export & backup">
        <ExportSection />
      </Card>

      <Card title="Install the app">
        <p className={styles.muted}>
          Put LMG Dash on your home screen so it opens full-screen like an app. On iPhone: tap Share
          in Safari, then <strong>Add to Home Screen</strong>. On a computer (Chrome or Edge): use
          the install icon in the address bar.
        </p>
      </Card>

      <Card title="Keyboard shortcuts" className={styles.desktopOnly}>
        <ShortcutList />
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
