import { Dimensions } from 'react-native'
import { useWindowDimensions as useRNWindowDimensions } from 'react-native'

// re-export react native's useWindowDimensions
export { useRNWindowDimensions as useWindowDimensions }

// custom hook for small screen detection
export function useIsSmallScreen() {
  const { width } = useRNWindowDimensions()
  return width < 768
}

// hook to get window dimensions
export function useDimensions() {
  const { width, height } = useRNWindowDimensions()
  return {
    width,
    height,
    isSmallScreen: width < 768,
  }
}

// export static dimensions for backward compatibility
// prefer hooks when inside components
export { kWidth, kHeight, isSmallScreen } from './static'
