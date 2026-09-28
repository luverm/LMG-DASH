import { RouterProvider } from 'react-router'
import { DataProvider } from './data/DataProvider'
import { router } from './router'

export function App() {
  return (
    <DataProvider>
      <RouterProvider router={router} />
    </DataProvider>
  )
}
