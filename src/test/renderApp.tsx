import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { DataProvider } from '@/app/data/DataProvider'
import type { DataContextValue } from '@/app/data/DataContext'
import { dataPaths } from '@/app/data/paths'
import { routes } from '@/app/routes'
import { LocalStore } from '@/lib/storage/localStore'
import { SyncEngine } from '@/lib/storage/syncEngine'
import { memoryStorage } from '@/lib/storage/types'

export function testData(overrides: Partial<DataContextValue> = {}): DataContextValue {
  const engine = new SyncEngine(new LocalStore(memoryStorage()), { debounceMs: 0 })
  return {
    engine,
    login: 'tester',
    paths: dataPaths('tester'),
    mode: 'local',
    lock: () => {},
    disconnect: () => {},
    ...overrides,
  }
}

export function renderApp(path = '/', data = testData()) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const utils = render(
    <DataProvider value={data}>
      <RouterProvider router={router} />
    </DataProvider>,
  )
  return { ...utils, data, router }
}
