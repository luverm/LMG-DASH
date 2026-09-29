import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
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
import { SolutionsProvider } from '@/features/solutions/SolutionsProvider'
import { WorkdayProvider } from '@/features/workday/WorkdayProvider'
import { Dialog } from '@/components/ui/Dialog'
import { useShortcuts } from '@/hooks/useShortcuts'
import { SaveIndicator } from './SaveIndicator'
import { ShortcutList } from './ShortcutList'
import { TopBar } from './TopBar'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { mode, tokenExpiresAt } = useData()
  const [capturing, setCapturing] = useState(false)
  const expiresIn = daysUntil(tokenExpiresAt)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useShortcuts({
    w: () => setCapturing(true),
    '?': () => setShowShortcuts(true),
    '1': () => navigate('/'),
    '2': () => navigate('/projects'),
    '3': () => navigate('/solutions'),
    '4': () => navigate('/history'),
  })
  // Block body on purpose: newer browsers return a Promise from scrollTo, and React would
  // treat a returned value as the effect's cleanup and try to call it.
  useEffect(() => {
    window.scrollTo?.(0, 0)
  }, [pathname])

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
                <SolutionsProvider>
                  <Outlet />
                  {capturing && <QuickCaptureDialog onClose={() => setCapturing(false)} />}
                  {showShortcuts && (
                    <Dialog
                      title="Keyboard shortcuts"
                      shape="square"
                      wide
                      onClose={() => setShowShortcuts(false)}
                    >
                      <ShortcutList />
                    </Dialog>
                  )}
                </SolutionsProvider>
              </ProjectsProvider>
            </WorkdayProvider>
          </main>
        </div>
      </QuickCaptureContext.Provider>
    </ToastProvider>
  )
}
