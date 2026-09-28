import { createContext, useContext } from 'react'
import type { DayRecord, Settings } from './types'

export type DayOp = (day: DayRecord, now: Date) => DayRecord

export interface WorkdayContextValue {
  settings: Settings
  today: DayRecord
  /** The last worked day before today (for carry-over and the resume note). */
  previous: DayRecord | null
  /** An earlier day whose clock was left running; ask when it really stopped. */
  recovery: DayRecord | null
  update(op: DayOp, options?: { immediate?: boolean }): void
  updateSettings(patch: Partial<Omit<Settings, 'version'>>): void
  resolveRecovery(end: Date): void
}

export const WorkdayContext = createContext<WorkdayContextValue | null>(null)

export function useWorkday(): WorkdayContextValue {
  const ctx = useContext(WorkdayContext)
  if (!ctx) throw new Error('useWorkday must be used inside WorkdayProvider')
  return ctx
}
