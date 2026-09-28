import { Outlet } from 'react-router'
import { useData } from '@/app/data/DataContext'
import { ShapeBackdrop } from '@/components/shapes/ShapeBackdrop'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { SaveIndicator } from './SaveIndicator'
import { TopBar } from './TopBar'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { mode, lock } = useData()
  return (
    <div className={styles.shell}>
      <ShapeBackdrop />
      <TopBar
        right={
          <>
            <SaveIndicator />
            {mode === 'github' && (
              <ShapeButton shape="square" variant="ghost" size="sm" onClick={lock} title="Lock">
                Lock
              </ShapeButton>
            )}
          </>
        }
      />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
