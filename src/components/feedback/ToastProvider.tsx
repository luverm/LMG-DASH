import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Shape } from '@/components/shapes/Shape'
import { ToastContext } from './ToastContext'
import styles from './Toast.module.css'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const show = useCallback((message: string) => setToast({ id: Date.now(), message }), [])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(id)
  }, [toast])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div key={toast.id} className={styles.toast} role="status">
          <Shape kind="circle" size={16} filled />
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}
