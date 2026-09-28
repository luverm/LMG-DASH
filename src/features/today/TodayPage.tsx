import { ShapeButton } from '@/components/ui/ShapeButton'
import { Card } from '@/components/ui/Card'

export function TodayPage() {
  return (
    <Card title="Today">
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <ShapeButton shape="circle" variant="solid" size="lg">
          Start work
        </ShapeButton>
        <ShapeButton shape="triangle">Break</ShapeButton>
        <ShapeButton shape="hexagon">Focus</ShapeButton>
        <ShapeButton shape="square">Close day</ShapeButton>
      </div>
    </Card>
  )
}
