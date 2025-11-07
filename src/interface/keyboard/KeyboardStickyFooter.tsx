import { LinearGradient } from '@tamagui/linear-gradient'
import type { ReactNode } from 'react'
import { KeyboardStickyView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack } from 'tamagui'

export const KeyboardStickyFooter = ({ children }: { children: ReactNode }) => {
  const { bottom } = useSafeAreaInsets()

  return (
    <KeyboardStickyView offset={{ closed: -bottom, opened: 0 }}>
      <YStack gap="$2" px="$3" py="$2">
        <LinearGradient
          fullscreen
          colors={['$background0', '$background']}
          start={[0, 0]}
          end={[0, 1]}
        />
        {children}
      </YStack>
    </KeyboardStickyView>
  )
}
