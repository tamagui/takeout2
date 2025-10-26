import { createContext, useContext } from 'react'
import type { HotUpdaterContextValue } from './types'

export const HotUpdaterContext = createContext<HotUpdaterContextValue | null>(null)

export const useHotUpdater = () => {
  const context = useContext(HotUpdaterContext)
  if (!context) {
    throw new Error('useHotUpdater must be used within HotUpdaterProvider')
  }
  return context
}
