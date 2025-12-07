import { LinearGradient } from '@tamagui/linear-gradient'
import type { ReactNode } from 'react'
import { YStack } from 'tamagui'

// web version - just a sticky footer without keyboard handling
export const KeyboardStickyFooter = ({ children }: { children: ReactNode }) => {
  return (
    <YStack position="absolute" b={0} l={0} r={0} gap="$2" px="$3" py="$2">
      <LinearGradient
        fullscreen
        colors={['$background0', '$background']}
        start={[0, 0]}
        end={[0, 1]}
      />
      {children}
    </YStack>
  )
}
