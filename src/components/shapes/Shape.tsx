import { shapeColor, type ShapeKind } from './shapes'

interface ShapeProps {
  kind: ShapeKind
  size?: number
  color?: string
  filled?: boolean
  strokeWidth?: number
  className?: string
  title?: string
}

export function Shape({
  kind,
  size = 20,
  color = shapeColor[kind],
  filled = false,
  strokeWidth = 2.25,
  className,
  title,
}: ShapeProps) {
  const common = {
    fill: filled ? color : 'none',
    stroke: color,
    strokeWidth,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {kind === 'circle' && <circle cx="12" cy="12" r="8.5" {...common} />}
      {kind === 'triangle' && <polygon points="12,3.5 20.5,19 3.5,19" {...common} />}
      {kind === 'hexagon' && (
        <polygon points="20.5,12 16.25,19.36 7.75,19.36 3.5,12 7.75,4.64 16.25,4.64" {...common} />
      )}
      {kind === 'square' && <rect x="4" y="4" width="16" height="16" rx="3" {...common} />}
    </svg>
  )
}
