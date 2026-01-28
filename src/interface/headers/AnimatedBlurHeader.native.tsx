import { useRouter } from 'one'
import { memo, useCallback } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SizableText, XStack, useTheme } from 'tamagui'

import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'

import { Button } from '../buttons/Button'
import { GlassView } from '../effects/GlassView'
import { GradientBlurView } from '../effects/GradientBlurView'

import type { ReactNode } from 'react'

export const HEADER_HEIGHT = 44
const BLUR_START_SCROLL = 10
const BLUR_END_SCROLL = 60

interface AnimatedBlurHeaderProps {
  scrollY: SharedValue<number>
  title?: string
  leftContent?: ReactNode
  rightContent?: ReactNode
  showBackButton?: boolean
  onBackPress?: () => void
}

export const AnimatedBlurHeader = memo(
  ({
    scrollY,
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

    const animatedBlurStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        scrollY.value,
        [BLUR_START_SCROLL, BLUR_END_SCROLL],
        [0, 1],
        Extrapolation.CLAMP
      )
      return { opacity }
    })

    const renderLeftContent = () => {
      if (leftContent) return leftContent

      if (showBackButton) {
        return (
          <Button
            size="large"
            glass
            circular
            onPress={() => router.back()}
            icon={<CaretLeftIcon size={22} color="$color12" />}
          />
        )
      }

      return <XStack width={36} />
    }

    return (
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: totalHeaderHeight,
            zIndex: 100,
            paddingTop: insets.top,
          },
        ]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, animatedBlurStyle]}>
          <GradientBlurView intensity={20} width="100%" height="100%" inverted />
        </Animated.View>

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
      </Animated.View>
    )
  }
)
