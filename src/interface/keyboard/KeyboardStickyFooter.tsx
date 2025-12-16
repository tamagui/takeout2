import { YStack } from 'tamagui'

import type { ReactNode } from 'react'

// web version - just a bit of padding

export const KeyboardStickyFooter = ({ children }: { children: ReactNode }) => {
  return (
    <YStack maxW={500} self="center" pt="$8" pb="$4">
      {children}
    </YStack>
  )
}
