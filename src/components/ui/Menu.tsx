import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useIsNarrow } from '@/hooks/useIsNarrow'
import styles from './Menu.module.css'

interface MenuProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  /** Shown at the top of the bottom sheet on phones. */
  title?: string
}

const GAP = 6
const EDGE = 8

/**
 * A popover menu rendered on top of everything (portal). On phones it becomes a
 * bottom sheet. Closes on outside tap, Escape, scroll and resize.
 */
export function Menu({ trigger, children, align = 'left', title }: MenuProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const narrow = useIsNarrow()
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' })
  const close = () => setOpen(false)

  // Place the popover next to its trigger, flipping above when there's no room below.
  useLayoutEffect(() => {
    if (!open || narrow || !root.current || !menu.current) return
    const r = root.current.getBoundingClientRect()
    const m = menu.current.getBoundingClientRect()
    const below = r.bottom + GAP
    const top =
      below + m.height > window.innerHeight - EDGE ? Math.max(EDGE, r.top - GAP - m.height) : below
    const left =
      align === 'right'
        ? Math.max(EDGE, r.right - m.width)
        : Math.min(r.left, window.innerWidth - m.width - EDGE)
    setStyle({ top, left })
  }, [open, narrow, align])

  useEffect(() => {
    if (!open) return
    const inside = (t: EventTarget | null) =>
      root.current?.contains(t as Node) || menu.current?.contains(t as Node)
    const onDown = (e: PointerEvent) => !inside(e.target) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onScroll = (e: Event) => !narrow && !inside(e.target) && setOpen(false)
    const onResize = () => setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    menu.current?.querySelector<HTMLElement>('button, select, input')?.focus()
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, narrow])

  return (
    <div className={styles.root} ref={root}>
      {trigger({
        open,
        toggle: () => {
          setStyle({ visibility: 'hidden' })
          setOpen((o) => !o)
        },
      })}
      {open &&
        createPortal(
          narrow ? (
            <div className={styles.sheetBackdrop}>
              <div ref={menu} className={styles.sheet} role="menu" aria-label={title}>
                <div className={styles.handle} aria-hidden />
                {title && <div className={styles.sheetTitle}>{title}</div>}
                {children(close)}
                <button type="button" className={styles.cancel} onClick={close}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div ref={menu} className={styles.menu} role="menu" aria-label={title} style={style}>
              {children(close)}
            </div>
          ),
          document.body,
        )}
    </div>
  )
}

export function MenuItem({ children, onSelect }: { children: ReactNode; onSelect: () => void }) {
  return (
    <button type="button" role="menuitem" className={styles.item} onClick={onSelect}>
      {children}
    </button>
  )
}
