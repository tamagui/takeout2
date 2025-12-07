import { LinearGradient } from '@tamagui/linear-gradient'
import { memo } from 'react'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SizableText, XStack } from 'tamagui'

import type { PageHeaderProps } from './PageHeader.types'
import type { ViewStyle } from 'react-native'

export const usePageHeader = () => {
  const { top } = useSafeAreaInsets()
  return {
    top,
    headerHeight: 50 + top,
  }
}

type PageHeaderNativeProps = PageHeaderProps & {
  headerTranslateY: SharedValue<number>
  style?: ViewStyle
}

export const PageHeader = memo(
  ({ headerTranslateY, style, Icon, title, after }: PageHeaderNativeProps) => {
    const { top, headerHeight } = usePageHeader()
    const safeAreaInsets = useSafeAreaInsets()

    const topGradientStyle = useAnimatedStyle(() => {
      return {
        opacity: interpolate(
          headerTranslateY.value,
          [-headerHeight / 2, 0],
          [1, 0],
          Extrapolation.CLAMP
        ),
      }
    })

    const headerAnimatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        headerTranslateY.value,
        [-headerHeight / 2, 0],
        [0, 1],
        Extrapolation.CLAMP
      )

      return {
        transform: [{ translateY: headerTranslateY.value * 0.5 }],
        opacity,
      }
    })

    return (
      <>
        {/* top gradient overlay - appears when header is hidden */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              pointerEvents: 'none',
              zIndex: 200,
            },
            topGradientStyle,
          ]}
        >
          <LinearGradient
            colors={['$background08', 'transparent']}
            position="absolute"
            t={0}
            l={0}
            r={0}
            b={0}
            height={top + 16}
          />
        </Animated.View>

        {/* header - stays fixed */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1001,

              paddingHorizontal: 12,
              paddingBottom: 8,
              paddingTop: top + 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
            headerAnimatedStyle,
            style,
          ]}
        >
          <LinearGradient
            colors={['$color3', '$color1']}
            position="absolute"
            t={0}
            l={0}
            r={0}
            height={44 + safeAreaInsets.top}
          />
          <XStack items="center" gap="$2">
            {Icon && <Icon size={24} />}
            <SizableText size="$5" fontWeight="600">
              {title}
            </SizableText>
          </XStack>

          <XStack gap="$4">{after}</XStack>
        </Animated.View>
      </>
    )
  }
)
