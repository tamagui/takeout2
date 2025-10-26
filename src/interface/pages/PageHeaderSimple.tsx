import { memo, type ReactNode } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SizableText, XStack, YStack } from 'tamagui'
import type { IconComponent } from '../icons/types'

export const usePageHeader = () => {
  const { top } = useSafeAreaInsets()
  return {
    top,
    headerHeight: 50 + top,
  }
}

type PageHeaderProps = {
  Icon?: IconComponent
  title: string
  after?: ReactNode
}

export const PageHeader = memo(({ Icon, title, after }: PageHeaderProps) => {
  const { top } = useSafeAreaInsets()

  return (
    <YStack bg="$background" borderBottomWidth={1} borderBottomColor="$borderColor">
      <XStack height={50} pt={top} px="$4" ai="center" jc="space-between">
        <XStack ai="center" gap="$2" flex={1}>
          {Icon && <Icon size={24} color="$color" />}
          <SizableText size="$6" fontWeight="600" numberOfLines={1}>
            {title}
          </SizableText>
        </XStack>
        {after && <XStack>{after}</XStack>}
      </XStack>
    </YStack>
  )
})
