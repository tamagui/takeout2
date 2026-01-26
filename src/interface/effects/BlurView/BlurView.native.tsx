import { BlurView as ExpoBlurView } from 'expo-blur'
import { styled } from 'tamagui'

import { useIsDark } from '~/features/theme/useIsDark'

import type { BlurViewProps } from './types'

const StyledBlurView = styled(ExpoBlurView, {
  name: 'BlurView',
})

export const BlurView = ({
  intensity,
  tint: tintProp,
  children,
  ...props
}: BlurViewProps & React.ComponentProps<typeof StyledBlurView>) => {
  const isDark = useIsDark()
  const tint = tintProp ?? (isDark ? 'dark' : 'light')

  return (
    <StyledBlurView intensity={intensity} tint={tint} {...props}>
      {children}
    </StyledBlurView>
  )
}
