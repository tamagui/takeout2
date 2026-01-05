import { BlurView } from 'expo-blur'
import { memo, useCallback, useState } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import Animated, {
  Extrapolation,
  interpolate,
  LinearTransition,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scheduleOnRN } from 'react-native-worklets'
import { SizableText, View, XStack, YStack } from 'tamagui'

import { useIsDark } from '~/features/theme/useIsDark'
import { lightImpact, mediumImpact } from '~/interface/haptics/haptics'
import { BellIcon } from '~/interface/icons/phosphor/BellIcon'
import { BookmarkIcon } from '~/interface/icons/phosphor/BookmarkIcon'
import { GearIcon } from '~/interface/icons/phosphor/GearIcon'
import { HeartIcon } from '~/interface/icons/phosphor/HeartIcon'
import { HouseIcon } from '~/interface/icons/phosphor/HouseIcon'
import { MagnifyingGlassIcon } from '~/interface/icons/phosphor/MagnifyingGlassIcon'
import { SparkleIcon } from '~/interface/icons/phosphor/SparkleIcon'
import { UserIcon } from '~/interface/icons/phosphor/UserIcon'

import { Pressable } from '../buttons/Pressable'
import { GlassView } from '../effects/GlassView'
import { CaretDownIcon } from '../icons/phosphor/CaretDownIcon'
import { TrashIcon } from '../icons/phosphor/TrashIcon'
import { XIcon } from '../icons/phosphor/XIcon'
import { FastSquircleView } from '../view/FastSquircleView'

import type { IconComponent } from '~/interface/icons/types'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

const FastSquircleViewAnimated = Animated.createAnimatedComponent(FastSquircleView)

const COLLAPSED_HEIGHT = 220
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.6
const FULLSCREEN_HEIGHT = SCREEN_HEIGHT

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
}

const SCROLL_THRESHOLD = 50

interface QuickMenuItem {
  icon: IconComponent
  label: string
  id: string
}

const QUICK_MENU_ITEMS: QuickMenuItem[] = [
  { icon: HouseIcon, label: 'Home', id: 'home' },
  { icon: SparkleIcon, label: 'AI Assistant', id: 'ai' },
  { icon: MagnifyingGlassIcon, label: 'Search', id: 'search' },
  { icon: UserIcon, label: 'Profile', id: 'profile' },
  { icon: BellIcon, label: 'Notifications', id: 'notifications' },
  { icon: BookmarkIcon, label: 'Saved', id: 'saved' },
  { icon: HeartIcon, label: 'Favorites', id: 'favorites' },
  { icon: GearIcon, label: 'Settings', id: 'settings' },
]

interface FeedDropdownProps {
  isOpen: SharedValue<number>
  onClose: () => void
}

export const FeedDropdown = memo(({ isOpen, onClose }: FeedDropdownProps) => {
  const insets = useSafeAreaInsets()
  const isDark = useIsDark()
  const expansion = useSharedValue(0)
  const startExpansion = useSharedValue(0)
  const prevIsOpen = useSharedValue(0)
  const prevScrollY = useSharedValue(0)
  const fullscreenProgress = useSharedValue(0)
  const [menuItems, setMenuItems] = useState(QUICK_MENU_ITEMS)

  // reset values when dropdown opens or closes
  useDerivedValue(() => {
    // when closing
    if (isOpen.value < 0.5 && prevIsOpen.value >= 0.5) {
      expansion.value = 0
      fullscreenProgress.value = 0
      prevScrollY.value = 0
    }
    // when opening
    if (isOpen.value > 0.5 && prevIsOpen.value <= 0.5) {
      expansion.value = 0
      fullscreenProgress.value = 0
      prevScrollY.value = 0
    }
    prevIsOpen.value = isOpen.value
  })

  const handleItemPress = useCallback(() => {
    lightImpact()
    // mock - do nothing for now
  }, [])

  const handleRemoveItem = useCallback((id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y
      const diff = currentY - prevScrollY.value
      prevScrollY.value = currentY

      if (expansion.value > 0.8) {
        if (diff > 0 && currentY > SCROLL_THRESHOLD) {
          const overScroll = currentY - SCROLL_THRESHOLD
          fullscreenProgress.value = Math.min(1, overScroll / 100)
        } else if (diff < -5) {
          fullscreenProgress.value = withTiming(0, { duration: 200 })
        }
      }
    },
    onEndDrag: () => {
      if (expansion.value > 0.8 && fullscreenProgress.value > 0.5) {
        expansion.value = withSpring(2, SPRING_CONFIG)
        scheduleOnRN(mediumImpact)
      } else {
        fullscreenProgress.value = withTiming(0, { duration: 200 })
      }
    },
  })

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startExpansion.value = expansion.value
    })
    .onUpdate((event) => {
      const dragDelta = event.translationY / 150
      const newExpansion = startExpansion.value + dragDelta
      expansion.value = Math.max(0, Math.min(1, newExpansion))
    })
    .onEnd((event) => {
      const velocity = event.velocityY
      const threshold = 300

      if (velocity < -threshold || (expansion.value < 0.2 && event.translationY < -30)) {
        expansion.value = withSpring(0, SPRING_CONFIG)
        scheduleOnRN(onClose)
        scheduleOnRN(lightImpact)
      } else if (velocity > threshold || expansion.value > 0.5) {
        expansion.value = withSpring(1, SPRING_CONFIG)
        scheduleOnRN(mediumImpact)
      } else {
        expansion.value = withSpring(expansion.value > 0.5 ? 1 : 0, SPRING_CONFIG)
      }
    })

  const animatedBackdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(isOpen.value, [0, 1], [0, 1], Extrapolation.CLAMP)
    return {
      opacity,
      pointerEvents: isOpen.value > 0.5 ? 'auto' : 'none',
    }
  })

  const animatedContainerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(isOpen.value, [0, 1], [-40, 0], Extrapolation.CLAMP)
    const opacity = interpolate(
      isOpen.value,
      [0, 0.5, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    )
    const scale = interpolate(isOpen.value, [0, 1], [0.95, 1], Extrapolation.CLAMP)

    const height = interpolate(
      expansion.value,
      [0, 1, 2],
      [COLLAPSED_HEIGHT, EXPANDED_HEIGHT, FULLSCREEN_HEIGHT],
      Extrapolation.CLAMP
    )

    const borderRadius = interpolate(
      expansion.value,
      [1, 2],
      [24, 0],
      Extrapolation.CLAMP
    )

    return {
      opacity,
      transform: [{ translateY }, { scale }],
      height,
      borderBottomLeftRadius: borderRadius,
      borderBottomRightRadius: borderRadius,
      pointerEvents: isOpen.value > 0.5 ? 'auto' : 'none',
    }
  })

  const animatedHandleStyle = useAnimatedStyle(() => {
    const baseWidth = interpolate(expansion.value, [0, 1], [40, 50], Extrapolation.CLAMP)
    const width = interpolate(
      fullscreenProgress.value,
      [0, 1],
      [baseWidth, 32],
      Extrapolation.CLAMP
    )
    const height = interpolate(
      fullscreenProgress.value,
      [0, 1],
      [5, 32],
      Extrapolation.CLAMP
    )
    const borderRadius = interpolate(
      fullscreenProgress.value,
      [0, 1],
      [3, 16],
      Extrapolation.CLAMP
    )
    return { width, height, borderRadius }
  })

  const animatedChevronStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      fullscreenProgress.value,
      [0.3, 0.7],
      [0, 1],
      Extrapolation.CLAMP
    )
    const scale = interpolate(
      fullscreenProgress.value,
      [0.3, 0.7],
      [0.5, 1],
      Extrapolation.CLAMP
    )
    return { opacity, transform: [{ scale }] }
  })

  // horizontal icons - visible when collapsed
  const animatedHorizontalStyle = useAnimatedStyle(() => {
    const opacity = interpolate(expansion.value, [0, 0.3], [1, 0], Extrapolation.CLAMP)
    return {
      opacity,
      pointerEvents: expansion.value < 0.3 ? 'auto' : 'none',
    }
  })

  // vertical list - visible when expanded
  const animatedVerticalStyle = useAnimatedStyle(() => {
    const opacity = interpolate(expansion.value, [0.3, 0.6], [0, 1], Extrapolation.CLAMP)
    return {
      opacity,
      pointerEvents: expansion.value > 0.3 ? 'auto' : 'none',
    }
  })

  return (
    <>
      {/* backdrop blur */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { zIndex: 998 }, animatedBackdropStyle]}
      >
        <BlurView
          intensity={20}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* dropdown container */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            overflow: 'hidden',
          },
          animatedContainerStyle,
        ]}
      >
        <GlassView
          isFallback
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          containerStyle={{ flex: 1, width: '100%', height: '100%' }}
        >
          <YStack flex={1} pt={insets.top} px="$4" pb="$3">
            {/* header row */}
            <XStack items="center" justify="space-between" mb="$4" pt="$2">
              <SizableText fontSize="$6" fontWeight="700" color="$color">
                Quick Menu
              </SizableText>

              <Pressable
                onPress={onClose}
                width={40}
                height={40}
                items="center"
                justify="center"
                rounded={14}
              >
                <XIcon size={22} color="$color" />
              </Pressable>
            </XStack>

            <View flex={1} position="relative">
              {/* horizontal icons - collapsed state */}
              <Animated.View
                style={[
                  { position: 'absolute', left: 0, right: 0, top: 0 },
                  animatedHorizontalStyle,
                ]}
              >
                <XStack gap="$3" justify="center" flexWrap="wrap">
                  {menuItems.slice(0, 6).map((item, index) => (
                    <QuickMenuIcon
                      key={item.id}
                      item={item}
                      index={index}
                      isOpen={isOpen}
                      onPress={handleItemPress}
                    />
                  ))}
                </XStack>
              </Animated.View>

              {/* vertical list - expanded state */}
              <Animated.View
                style={[
                  { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
                  animatedVerticalStyle,
                ]}
              >
                <Animated.ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 16, width: '100%' }}
                  style={{ width: '100%' }}
                  onScroll={scrollHandler}
                  scrollEventThrottle={16}
                >
                  <View style={{ gap: 4, width: '100%' }}>
                    {menuItems.map((item) => (
                      <QuickMenuRow
                        key={item.id}
                        item={item}
                        onPress={handleItemPress}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </View>
                </Animated.ScrollView>
              </Animated.View>
            </View>

            {/* drag handle */}
            <GestureDetector gesture={panGesture}>
              <View items="center" pt="$3" pb="$1">
                <Animated.View
                  style={[
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    animatedHandleStyle,
                  ]}
                >
                  <Animated.View style={animatedChevronStyle}>
                    <CaretDownIcon size={18} color="white" />
                  </Animated.View>
                </Animated.View>
              </View>
            </GestureDetector>
          </YStack>
        </GlassView>
      </Animated.View>
    </>
  )
})

interface QuickMenuIconProps {
  item: QuickMenuItem
  index: number
  isOpen: SharedValue<number>
  onPress: () => void
}

const QuickMenuIcon = ({ item, index, isOpen, onPress }: QuickMenuIconProps) => {
  const Icon = item.icon

  const animatedStyle = useAnimatedStyle(() => {
    const staggerDelay = index * 0.06
    const itemStart = 0.3 + staggerDelay
    const itemEnd = Math.min(itemStart + 0.4, 1)

    const itemProgress = interpolate(
      isOpen.value,
      [itemStart, itemEnd],
      [0, 1],
      Extrapolation.CLAMP
    )

    const scale = withSpring(
      interpolate(itemProgress, [0, 0.8, 1], [0.6, 1.05, 1], Extrapolation.CLAMP),
      SPRING_CONFIG
    )

    const opacity = interpolate(
      itemProgress,
      [0, 0.5, 1],
      [0, 0.7, 1],
      Extrapolation.CLAMP
    )

    return {
      opacity,
      transform: [{ scale }],
    }
  })

  return (
    <FastSquircleViewAnimated style={animatedStyle}>
      <Pressable
        onPress={onPress}
        width={48}
        height={48}
        items="center"
        justify="center"
        rounded={14}
        bg="$background04"
      >
        <Icon size={24} color="white" />
      </Pressable>
    </FastSquircleViewAnimated>
  )
}

interface RightActionProps {
  drag: SharedValue<number>
  onRemove: () => void
}

const RightAction = ({ drag, onRemove }: RightActionProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drag.value + 80 }],
    }
  })

  return (
    <Animated.View style={[styles.rightAction, animatedStyle]}>
      <Pressable
        onPress={onRemove}
        width={80}
        height="100%"
        items="center"
        justify="center"
      >
        <TrashIcon size={24} color="white" />
      </Pressable>
    </Animated.View>
  )
}

interface QuickMenuRowProps {
  item: QuickMenuItem
  onPress: () => void
  onRemove: (id: string) => void
}

const QuickMenuRow = ({ item, onPress, onRemove }: QuickMenuRowProps) => {
  const Icon = item.icon

  const handleRemove = useCallback(() => {
    mediumImpact()
    onRemove(item.id)
  }, [item.id, onRemove])

  const renderRightActions = useCallback(
    (_prog: SharedValue<number>, drag: SharedValue<number>) => {
      return <RightAction drag={drag} onRemove={handleRemove} />
    },
    [handleRemove]
  )

  return (
    <Animated.View style={{ width: '100%' }} layout={LinearTransition.springify()}>
      <FastSquircleView rounded={16} overflow="hidden">
        <ReanimatedSwipeable
          friction={2}
          rightThreshold={40}
          renderRightActions={renderRightActions}
          overshootRight={false}
        >
          <Pressable
            onPress={onPress}
            flexDirection="row"
            items="center"
            gap="$3"
            px="$3"
            py="$2"
            bg="$background04"
            width="100%"
          >
            <View width={44} height={44} items="center" justify="center" rounded={12}>
              <Icon size={20} color="white" />
            </View>
            <SizableText fontSize="$4" fontWeight="500" color="$color">
              {item.label}
            </SizableText>
          </Pressable>
        </ReanimatedSwipeable>
      </FastSquircleView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  rightAction: {
    width: 80,
    height: '100%',
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
