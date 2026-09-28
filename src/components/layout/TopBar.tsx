import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { navItems } from '@/app/navigation'
import { Shape } from '@/components/shapes/Shape'
import styles from './TopBar.module.css'

export function Logo() {
  return (
    <span className={styles.logo}>
      <span className={styles.logoShapes} aria-hidden>
        <Shape kind="circle" size={14} filled />
        <Shape kind="triangle" size={14} filled />
        <Shape kind="hexagon" size={14} filled />
        <Shape kind="square" size={14} filled />
      </span>
      LMG Dash
    </span>
  )
}

export function TopBar({ right }: { right?: ReactNode }) {
  return (
    <header className={styles.bar}>
      <Logo />
      <nav aria-label="Main" className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => (isActive ? `${styles.tab} ${styles.active}` : styles.tab)}
            style={{ ['--accent' as string]: item.color }}
          >
            <Shape kind={item.shape} size={14} color={item.color} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className={styles.right}>{right}</div>
    </header>
  )
}
