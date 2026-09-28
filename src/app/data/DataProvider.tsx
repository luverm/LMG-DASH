import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { open } from '@/lib/crypto'
import { GitHubStore } from '@/lib/storage/githubStore'
import { LocalStore } from '@/lib/storage/localStore'
import { SyncEngine } from '@/lib/storage/syncEngine'
import { ConnectPage } from '@/features/connect/ConnectPage'
import { UnlockPage } from '@/features/connect/UnlockPage'
import {
  clearCachedDocs,
  clearConnection,
  loadConnection,
  loadUnlockedToken,
  lockSession,
  saveConnection,
  saveUnlockedToken,
  touchUnlocked,
  type Connection,
} from './connection'
import { DataContext, type DataContextValue } from './DataContext'
import { dataPaths } from './paths'

function shortMessage(paths: string[]) {
  const names = paths.map((p) =>
    p
      .split('/')
      .pop()!
      .replace(/\.json$/, ''),
  )
  return `Update ${names.join(', ')}`
}

function buildEngine(connection: Connection, token: string | null): SyncEngine {
  if (connection.mode === 'local') {
    return new SyncEngine(new LocalStore(window.localStorage), { debounceMs: 300 })
  }
  const store = new GitHubStore({ token: token!, owner: connection.owner, repo: connection.repo })
  return new SyncEngine(store, { cache: window.localStorage, message: shortMessage })
}

interface DataProviderProps {
  children: ReactNode
  /** Tests inject a ready-made context and skip connecting. */
  value?: DataContextValue
}

export function DataProvider({ children, value }: DataProviderProps) {
  const [connection, setConnection] = useState<Connection | null>(() =>
    value ? null : loadConnection(),
  )
  const [token, setToken] = useState<string | null>(() => (value ? null : loadUnlockedToken()))

  const engine = useMemo(() => {
    if (value || !connection) return null
    if (connection.mode === 'github' && !token) return null
    return buildEngine(connection, token)
  }, [value, connection, token])

  const lock = useCallback(() => {
    void engine?.flush()
    lockSession()
    setToken(null)
  }, [engine])

  const disconnect = useCallback(() => {
    engine?.reset()
    // Local mode keeps its data (it's the only copy); GitHub mode drops the cached copy.
    if (connection?.mode === 'github') clearCachedDocs()
    clearConnection()
    setToken(null)
    setConnection(null)
  }, [engine, connection])

  // Save when the tab is hidden or the network comes back; keep the idle timer fresh.
  useEffect(() => {
    if (!engine) return
    const onHide = () => document.visibilityState === 'hidden' && void engine.flush()
    const onOnline = () => void engine.flush()
    let lastTouch = 0
    const onActivity = () => {
      const now = Date.now()
      if (now - lastTouch > 60_000) {
        lastTouch = now
        touchUnlocked(now)
      }
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('online', onOnline)
    window.addEventListener('pointerdown', onActivity)
    window.addEventListener('keydown', onActivity)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
    }
  }, [engine])

  // Auto-lock after the idle window passes while the tab stays open.
  useEffect(() => {
    if (connection?.mode !== 'github' || !token) return
    const id = setInterval(() => {
      if (!loadUnlockedToken()) setToken(null)
    }, 60_000)
    return () => clearInterval(id)
  }, [connection, token])

  const ctx = useMemo<DataContextValue | null>(() => {
    if (value) return value
    if (!engine || !connection) return null
    const login = connection.mode === 'github' ? connection.login : 'me'
    return {
      engine,
      login,
      paths: dataPaths(login),
      mode: connection.mode,
      repoLabel:
        connection.mode === 'github' ? `${connection.owner}/${connection.repo}` : undefined,
      tokenExpiresAt: connection.mode === 'github' ? connection.tokenExpiresAt : undefined,
      lock,
      disconnect,
    }
  }, [value, engine, connection, lock, disconnect])

  if (!ctx) {
    if (!connection) {
      return (
        <ConnectPage
          onConnected={(c, plainToken) => {
            saveConnection(c)
            if (plainToken) saveUnlockedToken(plainToken)
            setToken(plainToken)
            setConnection(c)
          }}
        />
      )
    }
    if (connection.mode === 'github') {
      return (
        <UnlockPage
          repoLabel={`${connection.owner}/${connection.repo}`}
          onUnlock={async (passphrase) => {
            const plain = await open(connection.sealedToken, passphrase)
            saveUnlockedToken(plain)
            setToken(plain)
          }}
          onForget={disconnect}
        />
      )
    }
  }

  return <DataContext.Provider value={ctx}>{children}</DataContext.Provider>
}
