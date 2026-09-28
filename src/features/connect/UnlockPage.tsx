import { useState, type FormEvent } from 'react'
import { Card } from '@/components/ui/Card'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { GateLayout } from './GateLayout'
import styles from './Connect.module.css'

interface UnlockPageProps {
  repoLabel: string
  onUnlock(passphrase: string): Promise<void>
  onForget(): void
}

export function UnlockPage({ repoLabel, onUnlock, onForget }: UnlockPageProps) {
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onUnlock(passphrase)
    } catch {
      setError("That passphrase didn't work.")
      setBusy(false)
    }
  }

  return (
    <GateLayout>
      <Card title="Welcome back">
        <form className={styles.form} onSubmit={submit}>
          <p className={styles.lead}>
            Enter your passphrase to unlock <code>{repoLabel}</code>.
          </p>
          <label className="field">
            <span>Passphrase</span>
            <input
              className="input"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
          </label>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <ShapeButton shape="circle" variant="solid" type="submit" disabled={busy}>
            {busy ? 'Unlocking…' : 'Unlock'}
          </ShapeButton>
        </form>
      </Card>
      <div className={styles.alt}>
        <ShapeButton
          shape="triangle"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm('Forget this connection on this device? Your data stays on GitHub.')) {
              onForget()
            }
          }}
        >
          Forget this device
        </ShapeButton>
      </div>
    </GateLayout>
  )
}
