import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useData } from '@/app/data/DataContext'
import { createSolution, mergeSolutions, patchSolution } from './solutions'
import { SolutionsContext, type SolutionsContextValue } from './SolutionsContext'
import { emptySolutionsFile, type Solution, type SolutionsFile } from './types'

export function SolutionsProvider({ children }: { children: ReactNode }) {
  const { engine, paths } = useData()
  const [file, setFile] = useState<SolutionsFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<SolutionsFile | null>(null)

  useEffect(() => {
    let cancelled = false
    engine
      .load<SolutionsFile>(paths.solutions, { merge: mergeSolutions })
      .then((f) => {
        if (cancelled) return
        ref.current = f ?? emptySolutionsFile
        setFile(ref.current)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [engine, paths])

  // Pick up merges after a conflict with another device.
  useEffect(
    () =>
      engine.subscribe(() => {
        const latest = engine.peek<SolutionsFile>(paths.solutions)
        if (latest && ref.current && latest !== ref.current) {
          ref.current = latest
          setFile(latest)
        }
      }),
    [engine, paths],
  )

  const write = useCallback(
    (change: (all: Record<string, Solution>) => Record<string, Solution>, immediate = false) => {
      const cur = ref.current ?? emptySolutionsFile
      const solutions = change(cur.solutions)
      if (solutions === cur.solutions) return
      const next: SolutionsFile = { version: 1, solutions }
      ref.current = next
      setFile(next)
      engine.set(paths.solutions, next, { merge: mergeSolutions, immediate })
    },
    [engine, paths],
  )

  const value = useMemo<SolutionsContextValue>(() => {
    const byId = file?.solutions ?? {}
    return {
      solutions: Object.values(byId).filter((s) => !s.deletedAt),
      get: (id) => (id ? byId[id] : undefined),
      create(input) {
        const solution = createSolution(input)
        write((all) => ({ ...all, [solution.id]: solution }), true)
        return solution
      },
      update(id, patch) {
        write((all) => (all[id] ? { ...all, [id]: patchSolution(all[id], patch) } : all))
      },
      remove(id) {
        write((all) =>
          all[id]
            ? { ...all, [id]: patchSolution(all[id], { deletedAt: new Date().toISOString() }) }
            : all,
        )
      },
    }
  }, [file, write])

  if (error) {
    return (
      <p role="alert" style={{ color: 'var(--rose)' }}>
        Couldn't load solutions: {error}
      </p>
    )
  }
  if (!file) return null
  return <SolutionsContext.Provider value={value}>{children}</SolutionsContext.Provider>
}
