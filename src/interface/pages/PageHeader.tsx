import { LinearGradient } from '@tamagui/linear-gradient'
import { memo } from 'react'
import { SizableText, XStack, YStack } from 'tamagui'

import type { PageHeaderProps } from './PageHeader.types'

// web version - static header without animations
export const usePageHeader = () => {
  return {
    top: 0,
    headerHeight: 50,
  }
}

export const PageHeader = memo(({ Icon, title, after }: PageHeaderProps) => {
  return (
    <YStack
      position="absolute"
      t={0}
      l={0}
      r={0}
      z={1001}
      px={12}
      pb={8}
      pt={8}
      flexDirection="row"
      items="center"
      justify="space-between"
    >
      <LinearGradient
        colors={['$color3', '$color1']}
        position="absolute"
        t={0}
        l={0}
        r={0}
        height={44}
      />
      <XStack items="center" gap="$2">
        {Icon && <Icon size={24} />}
        <SizableText size="$5" fontWeight="600">
          {title}
        </SizableText>
      </XStack>

      <XStack gap="$4">{after}</XStack>
    </YStack>
  )
})
