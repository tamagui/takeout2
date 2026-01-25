import { memo } from 'react'
import { XStack, YStack } from 'tamagui'

import type { OnboardingPageIndicatorProps } from './types'

export function OnboardingPageIndicator({
  totalPages,
  currentPage = 0,
}: OnboardingPageIndicatorProps) {
  return (
    <XStack gap={8} justify="center" items="center" py="$3">
      {Array.from({ length: totalPages }).map((_, idx) => (
        <IndicatorDot key={idx} isActive={idx === currentPage} />
      ))}
    </XStack>
  )
}

const IndicatorDot = memo(({ isActive }: { isActive: boolean }) => {
  return (
    <YStack
      width={isActive ? 28 : 8}
      height={8}
      rounded={4}
      bg={isActive ? '$color10' : '$color7'}
      transition="medium"
    />
  )
})
