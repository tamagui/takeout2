import { KeyboardStickyView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack } from 'tamagui'

import type { ReactNode } from 'react'

export const KeyboardStickyFooter = ({
  children,
  offset,
}: {
  children: ReactNode
  offset?: number
}) => {
  const { bottom } = useSafeAreaInsets()

  return (
    <KeyboardStickyView offset={{ closed: offset || -bottom, opened: 0 }}>
      <YStack gap="$2" px="$3" py="$2">
        {children}
      </YStack>
    </KeyboardStickyView>
  )
}
