import { createContext, useMemo, type FunctionComponent } from 'react'

import type { GradientConfig } from './LinearGradient'

// web version - no reanimated, just a passthrough provider
interface ShimmerContextType {
  progress: { value: number }
  increaseActiveShimmers: () => void
  decreaseActiveShimmers: () => void
  gradientConfig?: GradientConfig
}

const ShimmerContext = createContext<ShimmerContextType | null>(null)

interface ShimmerProviderProps {
  children?: React.ReactNode
  duration?: number
  gradientConfig?: GradientConfig
}

const noop = () => {}

const ShimmerProvider: FunctionComponent<ShimmerProviderProps> = ({ children }) => {
  // web shimmer uses CSS animations via ShimmerManager, no need for reanimated
  const contextValue = useMemo(
    () => ({
      progress: { value: 0 },
      gradientConfig: undefined,
      increaseActiveShimmers: noop,
      decreaseActiveShimmers: noop,
    }),
    []
  )

  return (
    <ShimmerContext.Provider value={contextValue}>{children}</ShimmerContext.Provider>
  )
}

export { ShimmerContext, ShimmerProvider }
