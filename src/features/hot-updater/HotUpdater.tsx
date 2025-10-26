import { HotUpdaterContext } from './context'
import type { HotUpdaterContextValue, HotUpdaterProviderProps } from './types'

/**
 * Web version of HotUpdaterProvider - no-op implementation
 * Hot updates are only supported on native platforms
 */
export function HotUpdaterProvider({ children, authData = null }: HotUpdaterProviderProps) {
  const contextValue: HotUpdaterContextValue = {
    isUpdateAvailable: false,
    isDownloading: false,
    downloadProgress: 0,
    checkForUpdate: async () => {
      console.info('Hot updates not supported on web')
    },
    applyUpdate: async () => {
      console.info('Hot updates not supported on web')
    },
    lastCheckTime: null,
    authData,
  }

  return (
    <HotUpdaterContext.Provider value={contextValue}>
      {children}
    </HotUpdaterContext.Provider>
  )
}

export { useHotUpdater } from './context'
