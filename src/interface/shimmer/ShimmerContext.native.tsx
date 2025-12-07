import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FunctionComponent,
} from 'react'
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'

import type { GradientConfig } from './LinearGradient'

interface ShimmerContextType {
  progress: SharedValue<number>
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

const ShimmerProvider: FunctionComponent<ShimmerProviderProps> = ({
  children,
  duration = 1500,
  gradientConfig,
}) => {
  const [activeShimmers, setActiveShimmers] = useState(0)
  const [isShimmerActive, setIsShimmerActive] = useState(false)
  const progress = useSharedValue(0)

  useEffect(() => {
    if (!isShimmerActive && activeShimmers > 0) {
      setIsShimmerActive(true)
      progress.value = 0
      progress.value = withRepeat(
        withTiming(1, {
          duration: duration,
          easing: Easing.linear,
        }),
        -1,
        false,
        undefined,
        ReduceMotion.System
      )
    }

    if (isShimmerActive && activeShimmers === 0) {
      cancelAnimation(progress)
      setIsShimmerActive(false)
    }
  }, [activeShimmers, isShimmerActive, progress, duration])

  const increaseActiveShimmers = useCallback(() => {
    setActiveShimmers((prev) => prev + 1)
  }, [])

  const decreaseActiveShimmers = useCallback(() => {
    setActiveShimmers((prev) => Math.max(prev - 1, 0))
  }, [])

  const contextValue = useMemo(
    () => ({
      progress,
      gradientConfig,
      increaseActiveShimmers,
      decreaseActiveShimmers,
    }),
    [progress, gradientConfig, increaseActiveShimmers, decreaseActiveShimmers]
  )

  return (
    <ShimmerContext.Provider value={contextValue}>{children}</ShimmerContext.Provider>
  )
}

export { ShimmerContext, ShimmerProvider }
