import { createContext, useContext } from 'react'
import type { Solution } from './types'

export interface SolutionsContextValue {
  /** All solutions that aren't deleted. */
  solutions: Solution[]
  get(id: string | undefined): Solution | undefined
  create(input: Partial<Solution> & { title: string }): Solution
  update(id: string, patch: Partial<Solution>): void
  remove(id: string): void
}

export const SolutionsContext = createContext<SolutionsContextValue | null>(null)

export function useSolutions(): SolutionsContextValue {
  const ctx = useContext(SolutionsContext)
  if (!ctx) throw new Error('useSolutions must be used inside SolutionsProvider')
  return ctx
}
