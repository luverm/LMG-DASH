import type { ReactNode } from 'react'
import { Logo } from '@/components/layout/TopBar'
import { ShapeBackdrop } from '@/components/shapes/ShapeBackdrop'
import styles from './Connect.module.css'

/** Full-screen layout for the connect and unlock screens (no navigation). */
export function GateLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.gate}>
      <ShapeBackdrop />
      <div className={styles.inner}>
        <div className={styles.logo}>
          <Logo />
        </div>
        {children}
      </div>
    </div>
  )
}
