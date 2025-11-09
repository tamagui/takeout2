import { useHeaderHeight } from '@react-navigation/elements'
import { isWeb } from 'tamagui'

/**
 * Safe wrapper for useHeaderHeight that returns 0 on web
 */
export function useHeaderHeightSafe(): number {
  if (isWeb) {
    return 0
  }

  // biome-ignore lint/correctness/useHookAtTopLevel: we need to use the hook at the top level
  const headerHeight = useHeaderHeight() || 0

  return headerHeight
}
