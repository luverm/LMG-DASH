import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import { ShapeBackdrop } from '@/components/shapes/ShapeBackdrop'
import { TopBar } from './TopBar'
import styles from './AppLayout.module.css'

export function AppLayout({ topBarRight }: { topBarRight?: ReactNode }) {
  return (
    <div className={styles.shell}>
      <ShapeBackdrop />
      <TopBar right={topBarRight} />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
