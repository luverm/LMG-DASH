import { NavLink } from 'react-router'
import { navItems } from '@/app/navigation'
import styles from './Sidebar.module.css'

export function Sidebar() {
  return (
    <nav className={styles.sidebar} aria-label="Main">
      <ul>
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
