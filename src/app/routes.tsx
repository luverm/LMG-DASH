import type { RouteObject } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
