import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated'

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

export function ExpandedMenuItem({
  item,
  index,
  animationProgress,
  isSelected,
  onPress,
}: ExpandedMenuItemProps) {
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
      <Pressable
        onPress={onPress}
        style={styles.menuItem}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: isSelected }}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.menuItemBackground,
            animatedSelectionStyle,
          ]}
        />

        <View style={styles.menuIconContainer}>
          <Icon size={20} color={isSelected ? 'white' : '$color8'} />
        </View>

        <Text style={[styles.menuLabel, { color: isSelected ? '#FFFFFF' : '#AAAAAA' }]}>
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 99,
    position: 'relative',
  },
  menuItemBackground: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
  },
  menuIconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
})
