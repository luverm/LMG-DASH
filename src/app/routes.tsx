import type { RouteObject } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { HistoryPage } from '@/features/history/HistoryPage'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { TodayPage } from '@/features/today/TodayPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
