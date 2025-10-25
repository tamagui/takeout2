import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AppInitContextType {
  isNavigationReady: boolean
  setNavigationReady: (ready: boolean) => void
}

const AppInitContext = createContext<AppInitContextType | undefined>(undefined)

export function AppInitProvider({ children }: { children: ReactNode }) {
  const [isNavigationReady, setIsNavigationReady] = useState<boolean>(false)

  const handleSetNavigationReady = useCallback((ready: boolean) => {
    setIsNavigationReady(ready)
  }, [])

  return (
    <AppInitContext.Provider
      value={{
        isNavigationReady,
        setNavigationReady: handleSetNavigationReady,
      }}
    >
      {children}
    </AppInitContext.Provider>
  )
}

export function useAppInitContext() {
  const context = useContext(AppInitContext)
  if (!context) {
    throw new Error('useAppInitContext must be used within AppInitProvider')
  }
  return context
}
