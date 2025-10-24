import { memo } from 'react'
import { H4, YStack } from 'tamagui'

export const NotFound = memo(() => {
  return (
    <YStack pointerEvents="none" flex={1} items="center" justify="center">
      {/* <IntroBackground /> */}

      <H4 opacity={0.5} select="none" fontFamily="$mono">
        Not found
      </H4>
    </YStack>
  )
})
