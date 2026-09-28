import { useState, type FormEvent } from 'react'
import { Card } from '@/components/ui/Card'
import { ShapeButton } from '@/components/ui/ShapeButton'
import type { Connection } from '@/app/data/connection'
import { seal } from '@/lib/crypto'
import { verifyGitHubAccess } from '@/lib/storage/githubStore'
import { GateLayout } from './GateLayout'
import styles from './Connect.module.css'

interface ConnectPageProps {
  onConnected(connection: Connection, token: string | null): void
}

const MIN_PASSPHRASE = 8

export function ConnectPage({ onConnected }: ConnectPageProps) {
  const [repo, setRepo] = useState('')
  const [token, setToken] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function connect(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const [owner, name] = repo.trim().split('/')
    if (!owner || !name) return setError('Enter the repository as owner/name.')
    if (passphrase.length < MIN_PASSPHRASE) {
      return setError(`Use a passphrase of at least ${MIN_PASSPHRASE} characters.`)
    }
    if (passphrase !== repeat) return setError("The passphrases don't match.")
    setBusy(true)
    try {
      const access = await verifyGitHubAccess({ token: token.trim(), owner, repo: name })
      if (!access.isPrivate) {
        throw new Error(`${owner}/${name} is public. Make it private before storing notes in it.`)
      }
      if (!access.canWrite) {
        throw new Error('The token can read but not write. Give it "Contents: Read and write".')
      }
      const sealedToken = await seal(token.trim(), passphrase)
      onConnected(
        {
          mode: 'github',
          owner,
          repo: name,
          login: access.login,
          sealedToken,
          tokenExpiresAt: access.tokenExpiresAt,
        },
        token.trim(),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <GateLayout>
      <Card title="Connect your data">
        <p className={styles.lead}>
          Your notes are saved in a private GitHub repository that only you can read.
        </p>
        <ol className={styles.steps}>
          <li>
            <a href="https://github.com/new" target="_blank" rel="noreferrer">
              Create a private repository
            </a>
            , for example <code>lmg-dash-data</code>. It can be empty.
          </li>
          <li>
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noreferrer"
            >
              Create a fine-grained token
            </a>
            : <em>Only select repositories</em> → your data repo, permission{' '}
            <em>Contents: Read and write</em>, and an expiry date.
          </li>
          <li>Paste it below and choose a passphrase to lock it on this device.</li>
        </ol>
        <form className={styles.form} onSubmit={connect}>
          <label className="field">
            <span>Data repository</span>
            <input
              className="input"
              placeholder="your-name/lmg-dash-data"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              autoComplete="off"
              required
            />
          </label>
          <label className="field">
            <span>Token</span>
            <input
              className="input"
              type="password"
              placeholder="github_pat_…"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
              required
            />
          </label>
          <div className={styles.row}>
            <label className="field">
              <span>Passphrase</span>
              <input
                className="input"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
            <label className="field">
              <span>Repeat passphrase</span>
              <input
                className="input"
                type="password"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
          </div>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <ShapeButton shape="circle" variant="solid" type="submit" disabled={busy}>
            {busy ? 'Checking…' : 'Connect'}
          </ShapeButton>
        </form>
      </Card>
      <div className={styles.alt}>
        <ShapeButton
          shape="square"
          variant="ghost"
          size="sm"
          onClick={() => onConnected({ mode: 'local' }, null)}
        >
          Try it in this browser only
        </ShapeButton>
      </div>
    </GateLayout>
  )
}
