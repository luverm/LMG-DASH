import { Dialog } from '@/components/ui/Dialog'
import { ShapeButton } from '@/components/ui/ShapeButton'
import type { AwayChoice } from '@/features/workday/day'
import { formatDuration, formatTimeOfDay } from '@/lib/time'

interface AwayDialogProps {
  from: Date
  to: Date
  onChoose(choice: AwayChoice): void
}

/** Asks what the time away from the computer was, while the clock kept running. */
export function AwayDialog({ from, to, onChoose }: AwayDialogProps) {
  return (
    <Dialog
      title="Welcome back"
      shape="triangle"
      onClose={() => onChoose('work')}
      footer={
        <>
          <ShapeButton shape="square" variant="ghost" onClick={() => onChoose('none')}>
            I wasn't working
          </ShapeButton>
          <ShapeButton shape="triangle" onClick={() => onChoose('break')}>
            It was a break
          </ShapeButton>
          <ShapeButton shape="circle" variant="solid" onClick={() => onChoose('work')}>
            Keep as work
          </ShapeButton>
        </>
      }
    >
      <p>
        You were away for <strong>{formatDuration(to.getTime() - from.getTime())}</strong> (
        {formatTimeOfDay(from)}–{formatTimeOfDay(to)}) while the clock was running. What was that
        time?
      </p>
    </Dialog>
  )
}
