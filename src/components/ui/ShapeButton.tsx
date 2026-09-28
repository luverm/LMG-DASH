import { useRef, type ButtonHTMLAttributes, type PointerEvent } from 'react'
import { Shape } from '@/components/shapes/Shape'
import { shapeColor, type ShapeKind } from '@/components/shapes/shapes'
import styles from './ShapeButton.module.css'

interface ShapeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  shape: ShapeKind
  /** solid: pastel fill (primary). soft: tinted. ghost: text only. */
  variant?: 'solid' | 'soft' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  color?: string
  showIcon?: boolean
  iconFilled?: boolean
}

/**
 * Button with a shape icon and a shape-specific press animation:
 * circle ripples, triangle wobbles, hexagon turns 60°, square squishes.
 */
export function ShapeButton({
  shape,
  variant = 'soft',
  size = 'md',
  color = shapeColor[shape],
  showIcon = true,
  iconFilled,
  className,
  children,
  onPointerDown,
  style,
  ...rest
}: ShapeButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)

  function handlePointerDown(e: PointerEvent<HTMLButtonElement>) {
    const el = ref.current
    if (el) {
      // Restart the press animation even on rapid repeated presses.
      el.classList.remove(styles.animate)
      void el.offsetWidth
      el.classList.add(styles.animate)
    }
    onPointerDown?.(e)
  }

  const iconColor = variant === 'solid' ? 'var(--on-pastel)' : color
  return (
    <button
      ref={ref}
      type="button"
      className={[styles.button, styles[variant], styles[size], styles[shape], className]
        .filter(Boolean)
        .join(' ')}
      style={{ ['--accent' as string]: color, ...style }}
      onPointerDown={handlePointerDown}
      onAnimationEnd={(e) => e.currentTarget.classList.remove(styles.animate)}
      {...rest}
    >
      {showIcon && (
        <span className={styles.icon}>
          <Shape
            kind={shape}
            color={iconColor}
            size={size === 'lg' ? 22 : size === 'sm' ? 14 : 18}
            filled={iconFilled}
          />
        </span>
      )}
      {children != null && <span>{children}</span>}
    </button>
  )
}
