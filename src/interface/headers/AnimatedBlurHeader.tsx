import { useRouter } from 'one'
import { memo, useCallback } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SizableText, XStack, View } from 'tamagui'

import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'

import { Button } from '../buttons/Button'

import type { ReactNode } from 'react'

export const HEADER_HEIGHT = 44

interface AnimatedBlurHeaderProps {
  scrollY?: { value: number }
  title?: string
  leftContent?: ReactNode
  rightContent?: ReactNode
  showBackButton?: boolean
  onBackPress?: () => void
}

export const AnimatedBlurHeader = memo(
  ({
    title = '',
    leftContent,
    rightContent,
    showBackButton = true,
    onBackPress,
  }: AnimatedBlurHeaderProps) => {
    const insets = useSafeAreaInsets()
    const router = useRouter()

    const totalHeaderHeight = HEADER_HEIGHT + insets.top

    const handleBackPress = useCallback(() => {
      if (onBackPress) {
        onBackPress()
      } else {
        router.back()
      }
    }, [onBackPress, router])

    const renderLeftContent = () => {
      if (leftContent) return leftContent

      if (showBackButton) {
        return (
          <Button
            size="large"
            glass
            circular
            onPress={handleBackPress}
            icon={<CaretLeftIcon size={22} color="$color12" />}
          />
        )
      }

      return <XStack width={36} />
    }

    return (
      <View
        position="absolute"
        t={0}
        l={0}
        r={0}
        height={totalHeaderHeight}
        z={100}
        pt={insets.top}
        bg="$background"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <XStack flex={1} items="center" justify="space-between" px="$3">
          <XStack width={60} items="center" justify="flex-start">
            {renderLeftContent()}
          </XStack>

          <XStack flex={1} items="center" justify="center">
            <SizableText fontSize="$5" fontWeight="600" color="$color" numberOfLines={1}>
              {title}
            </SizableText>
          </XStack>

          <XStack width={60} items="center" justify="flex-end">
            {rightContent}
          </XStack>
        </XStack>
      </View>
    )
  }
)
