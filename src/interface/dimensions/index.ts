import { useWindowDimensions as useTamaguiWindowDimensions } from 'tamagui'

// re-export tamagui's useWindowDimensions
export { useTamaguiWindowDimensions as useWindowDimensions }

// custom hook for small screen detection
export function useIsSmallScreen() {
  const { width } = useTamaguiWindowDimensions()
  return width < 768
}

// hook to get window dimensions
export function useDimensions() {
  const { width, height } = useTamaguiWindowDimensions()
  return {
    width,
    height,
    isSmallScreen: width < 768,
  }
}

// export static dimensions for backward compatibility
// prefer hooks when inside components
export { kWidth, kHeight, isSmallScreen } from './static'
