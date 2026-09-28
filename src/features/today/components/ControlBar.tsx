import { Shape } from '@/components/shapes/Shape'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { breakTypes, type BreakType, type DayState } from '@/features/workday/types'
import styles from './ControlBar.module.css'

interface ControlBarProps {
  state: DayState
  onStart(): void
  onPause(): void
  onBreak(type: BreakType): void
  onClose(): void
  onReopen(): void
}

export function ControlBar({
  state,
  onStart,
  onPause,
  onBreak,
  onClose,
  onReopen,
}: ControlBarProps) {
  if (state === 'closed') {
    return (
      <div className={styles.bar}>
        <ShapeButton shape="circle" variant="soft" onClick={onReopen}>
          Keep working
        </ShapeButton>
      </div>
    )
  }
  if (state === 'idle') {
    return (
      <div className={styles.bar}>
        <ShapeButton shape="circle" variant="solid" size="lg" onClick={onStart}>
          Start work
        </ShapeButton>
      </div>
    )
  }

  return (
    <div className={styles.bar}>
      {state === 'working' && (
        <ShapeButton shape="circle" variant="solid" size="lg" onClick={onPause}>
          Pause
        </ShapeButton>
      )}
      {state === 'paused' && (
        <ShapeButton shape="circle" variant="solid" size="lg" onClick={onStart}>
          Resume
        </ShapeButton>
      )}
      {state === 'break' && (
        <ShapeButton shape="circle" variant="solid" size="lg" onClick={onStart}>
          Back to work
        </ShapeButton>
      )}
      {state !== 'break' && (
        <Menu
          title="Take a break"
          trigger={({ open, toggle }) => (
            <ShapeButton
              shape="triangle"
              aria-expanded={open}
              aria-haspopup="menu"
              onClick={toggle}
            >
              Break ▾
            </ShapeButton>
          )}
        >
          {(close) =>
            breakTypes.map((b) => (
              <MenuItem
                key={b.type}
                onSelect={() => {
                  close()
                  onBreak(b.type)
                }}
              >
                <Shape kind="triangle" size={14} />
                {b.label}
              </MenuItem>
            ))
          }
        </Menu>
      )}
      <ShapeButton shape="square" onClick={onClose}>
        Close day
      </ShapeButton>
    </div>
  )
}
