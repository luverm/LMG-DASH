import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './Menu.module.css'

interface MenuProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
}

/** A small popover menu that closes on outside click and Escape. */
export function Menu({ trigger, children, align = 'left' }: MenuProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={styles.root} ref={root}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className={`${styles.menu} ${styles[align]}`} role="menu">
          {children(() => setOpen(false))}
        </div>
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
