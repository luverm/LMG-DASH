import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Shape } from '@/components/shapes/Shape'
import type { ShapeKind } from '@/components/shapes/shapes'
import styles from './Dialog.module.css'

interface DialogProps {
  title: string
  shape?: ShapeKind
  color?: string
  onClose?: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

/** Modal dialog. Escape and clicking the backdrop close it when onClose is given. */
export function Dialog({ title, shape, color, onClose, children, footer, wide }: DialogProps) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const first = panel.current?.querySelector<HTMLElement>(
      'input, textarea, select, button:not([data-close])',
    )
    first?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [onClose])

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={panel}
        className={`${styles.panel} ${wide ? styles.wide : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles.header}>
          {shape && <Shape kind={shape} color={color} size={20} />}
          <h2 id={titleId}>{title}</h2>
          {onClose && (
            <button className={styles.close} onClick={onClose} aria-label="Close" data-close>
              ×
            </button>
          )}
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}
