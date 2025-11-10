import { useHeaderHeight } from '@react-navigation/elements'

export function useHeaderHeightSafe(): number {
  return useHeaderHeight() || 0
}
