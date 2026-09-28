import { createContext, useContext, useSyncExternalStore } from 'react'
import type { SyncEngine } from '@/lib/storage/syncEngine'
import type { DataPaths } from './paths'

export interface DataContextValue {
  engine: SyncEngine
  login: string
  paths: DataPaths
  mode: 'local' | 'github'
  repoLabel?: string
  tokenExpiresAt?: string
  lock(): void
  disconnect(): void
}

export const DataContext = createContext<DataContextValue | null>(null)

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}

export function useSyncStatus() {
  const { engine } = useData()
  const status = useSyncExternalStore(engine.subscribe, () => engine.status)
  return { status, error: engine.error }
}
