import { useRef, type ButtonHTMLAttributes, type PointerEvent } from 'react'
import { shapeColor, type ShapeKind } from '@/components/shapes/shapes'
import styles from './ShapeButton.module.css'

interface ShapeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Sets the color and the press animation; the button itself shows only its label. */
  shape: ShapeKind
  /** solid: pastel fill (primary). soft: tinted. ghost: text only. */
  variant?: 'solid' | 'soft' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

/**
 * Text button with a shape-specific press animation:
 * circle ripples, triangle wobbles, hexagon pops, square squishes.
 */
export function ShapeButton({
  shape,
  variant = 'soft',
  size = 'md',
  color = shapeColor[shape],
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
      {children}
    </button>
  )
}
