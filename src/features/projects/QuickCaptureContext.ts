import { createContext, useContext } from 'react'

export const QuickCaptureContext = createContext<() => void>(() => {})

/** Opens the "New wish" dialog from anywhere. */
export const useQuickCapture = () => useContext(QuickCaptureContext)
