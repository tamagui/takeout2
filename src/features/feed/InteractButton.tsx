import type LottieView from 'lottie-react-native'
import type { RefObject } from 'react'
import type { IconProps } from '~/interface/icons/types'

export interface InteractButtonProps {
  icon: React.ComponentType<IconProps>
  count: number
  onPress?: () => void
  active?: boolean
  lottieSource?: any
  lottieRef?: RefObject<LottieView | null>
  lottieScale?: number
}

export function InteractButton({
  icon: Icon,
  count,
  onPress,
  active = false,
  lottieSource,
  lottieRef,
  lottieScale = 2.5,
}: InteractButtonProps) {
  return null
}
