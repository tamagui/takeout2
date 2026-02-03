import { memo } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated'
import { SizableText, styled, View } from 'tamagui'

import { Pressable } from '../buttons/Pressable'

import type { ExpandedMenuItemType } from '../../features/app/TabBar'

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 190,
  mass: 0.8,
}

interface ExpandedMenuItemProps {
  item: ExpandedMenuItemType
  index: number
  animationProgress: SharedValue<number>
  totalItems: number
  isSelected: boolean
  onPress: () => void
}

const MenuPressable = styled(Pressable, {
  flexDirection: 'row',
  items: 'center',
  py: '$3',
  px: '$4',
  rounded: 99,
  position: 'relative',
})

export const ExpandedMenuItem = memo(
  ({ item, index, animationProgress, isSelected, onPress }: ExpandedMenuItemProps) => {
    const Icon = item.icon

    const animatedStyle = useAnimatedStyle(() => {
      const startThreshold = 0.4
      const staggerDelay = index * 0.05
      const itemStartThreshold = startThreshold + staggerDelay
      const itemEndThreshold = Math.min(itemStartThreshold + 0.3, 1)

      const itemProgress = interpolate(
        animationProgress.value,
        [itemStartThreshold, itemEndThreshold],
        [0, 1],
        Extrapolation.CLAMP
      )

      const opacity = interpolate(
        itemProgress,
        [0, 0.5, 1],
        [0, 0.8, 1],
        Extrapolation.CLAMP
      )

      const translateY = withSpring(
        interpolate(itemProgress, [0, 1], [40, 0], Extrapolation.CLAMP),
        SPRING_CONFIG
      )

      const scale = withSpring(
        interpolate(itemProgress, [0, 0.8, 1], [0.7, 1.02, 1], Extrapolation.CLAMP),
        SPRING_CONFIG
      )

      const isInteractive = animationProgress.value > 0.7

      return {
        opacity,
        transform: [{ translateY }, { scale }],
        pointerEvents: isInteractive ? 'auto' : 'none',
      }
    })

    const animatedSelectionStyle = useAnimatedStyle(() => {
      const scale = isSelected ? 1 : 0.95
      const opacity = isSelected ? 0.15 : 0

      return {
        opacity,
        transform: [{ scale: withSpring(scale, SPRING_CONFIG) }],
      }
    })

    return (
      <Animated.View style={animatedStyle}>
        <MenuPressable
          onPress={onPress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: isSelected }}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: '#FFFFFF', borderRadius: 99 },

              animatedSelectionStyle,
            ]}
          />

          <View width={28} height={28} items="center" justify="center" mr="$3">
            <Icon size={20} color={isSelected ? '$color12' : '$color10'} />
          </View>

          <SizableText
            size="$3"
            flex={1}
            color={isSelected ? '$color12' : '$color10'}
            fontWeight={isSelected ? 'bold' : '600'}
          >
            {item.label}
          </SizableText>
        </MenuPressable>
      </Animated.View>
    )
  }
)
