import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { daysUntil } from '@/app/data/connection'
import { useData } from '@/app/data/DataContext'
import { ToastProvider } from '@/components/feedback/ToastProvider'
import { GearIcon } from '@/components/shapes/GearIcon'
import { ShapeBackdrop } from '@/components/shapes/ShapeBackdrop'
import { Shape } from '@/components/shapes/Shape'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { QuickCaptureDialog } from '@/features/projects/components/QuickCaptureDialog'
import { QuickCaptureContext } from '@/features/projects/QuickCaptureContext'
import { ProjectsProvider } from '@/features/projects/ProjectsProvider'
import { WorkdayProvider } from '@/features/workday/WorkdayProvider'
import { SaveIndicator } from './SaveIndicator'
import { TopBar } from './TopBar'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { mode, tokenExpiresAt } = useData()
  const [capturing, setCapturing] = useState(false)
  const expiresIn = daysUntil(tokenExpiresAt)
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo?.(0, 0), [pathname])

  return (
    <ToastProvider>
      <QuickCaptureContext.Provider value={() => setCapturing(true)}>
        <div className={styles.shell}>
          <ShapeBackdrop />
          <TopBar
            right={
              <>
                <SaveIndicator />
                <ShapeButton
                  shape="hexagon"
                  color="var(--butter)"
                  size="sm"
                  onClick={() => setCapturing(true)}
                  title="Note down a coworker's wish"
                >
                  Wish
                </ShapeButton>
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    isActive ? `${styles.settings} ${styles.settingsActive}` : styles.settings
                  }
                  aria-label="Settings"
                  title="Settings"
                >
                  <GearIcon size={20} />
                </NavLink>
              </>
            }
          />
          {mode === 'github' && expiresIn !== null && expiresIn <= 14 && (
            <div className={styles.banner} role="alert">
              <Shape kind="triangle" size={16} color="var(--rose)" />
              {expiresIn < 0
                ? 'Your GitHub token has expired. '
                : `Your GitHub token expires in ${expiresIn} day${expiresIn === 1 ? '' : 's'}. `}
              <Link to="/settings">Replace it</Link>
            </div>
          )}
          <main className={styles.content}>
            <WorkdayProvider>
              <ProjectsProvider>
                <Outlet />
                {capturing && <QuickCaptureDialog onClose={() => setCapturing(false)} />}
              </ProjectsProvider>
            </WorkdayProvider>
          </main>
        </div>
      </QuickCaptureContext.Provider>
    </ToastProvider>
  )
}
