import { useRouter } from 'one'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
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

import { BlurView } from '~/interface/effects/BlurView'
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
import { showToast } from '../toast/helpers'
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
  const router = useRouter()
  const expansion = useSharedValue(0)
  const startExpansion = useSharedValue(0)
  const prevIsOpen = useSharedValue(0)
  const prevScrollY = useSharedValue(0)
  const fullscreenProgress = useSharedValue(0)
  const [menuItems, setMenuItems] = useState(QUICK_MENU_ITEMS)
  const swipeableRefs = useRef<Map<string, SwipeableMethods>>(new Map())

  const resetSwipeables = useCallback(() => {
    swipeableRefs.current.forEach((ref) => {
      ref.close()
    })
  }, [])

  useDerivedValue(() => {
    if (isOpen.value < 0.5 && prevIsOpen.value >= 0.5) {
      expansion.value = 0
      fullscreenProgress.value = 0
      prevScrollY.value = 0
      scheduleOnRN(resetSwipeables)
    }
    if (isOpen.value > 0.5 && prevIsOpen.value <= 0.5) {
      expansion.value = 0
      fullscreenProgress.value = 0
      prevScrollY.value = 0
      scheduleOnRN(resetSwipeables)
    }
    prevIsOpen.value = isOpen.value
  })

  const handleItemPress = useCallback(
    (id: string) => {
      lightImpact()
      onClose()

      switch (id) {
        case 'home':
          router.push('/home/feed')
          break
        case 'ai':
          router.push('/home/ai')
          break
        case 'search':
          router.push('/home/search')
          break
        case 'profile':
          router.push('/home/profile')
          break
        case 'settings':
          router.push('/home/settings')
          break
        case 'favorites':
          router.push('/home/feed')
          break
        case 'notifications':
        case 'saved':
          showToast('Coming soon', { type: 'info' })
          break
      }
    },
    [onClose, router]
  )

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

      if (startExpansion.value < 0.1) {
        if (event.translationY > 0) {
          expansion.value = Math.min(1, dragDelta)
        } else {
          const closeProgress = Math.min(1, Math.abs(event.translationY) / 100)
          isOpen.value = 1 - closeProgress * 0.5
        }
      } else {
        const newExpansion = startExpansion.value + dragDelta
        expansion.value = Math.max(0, Math.min(1, newExpansion))
      }
    })
    .onEnd((event) => {
      const velocity = event.velocityY
      const threshold = 300

      if (isOpen.value < 1 && isOpen.value > 0.5) {
        isOpen.value = withSpring(1, SPRING_CONFIG)
      }

      if (startExpansion.value < 0.1) {
        if (event.translationY < -50 || velocity < -threshold) {
          expansion.value = withSpring(0, SPRING_CONFIG)
          isOpen.value = withTiming(0, { duration: 200 })
          scheduleOnRN(onClose)
          scheduleOnRN(lightImpact)
        } else if (event.translationY > 30 || velocity > threshold) {
          expansion.value = withSpring(1, SPRING_CONFIG)
          scheduleOnRN(mediumImpact)
        } else {
          expansion.value = withSpring(0, SPRING_CONFIG)
        }
      } else {
        if (
          velocity < -threshold ||
          (expansion.value < 0.2 && event.translationY < -30)
        ) {
          expansion.value = withSpring(0, SPRING_CONFIG)
          scheduleOnRN(lightImpact)
        } else if (velocity > threshold || expansion.value > 0.5) {
          expansion.value = withSpring(1, SPRING_CONFIG)
          scheduleOnRN(mediumImpact)
        } else {
          expansion.value = withSpring(expansion.value > 0.5 ? 1 : 0, SPRING_CONFIG)
        }
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

  const animatedHandleContainerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(expansion.value, [1.5, 2], [1, 0], Extrapolation.CLAMP)
    return {
      opacity,
      pointerEvents: expansion.value < 1.8 ? 'auto' : 'none',
    }
  })

  const animatedFloatingHandleStyle = useAnimatedStyle(() => {
    const containerHeight = interpolate(
      expansion.value,
      [0, 1, 2],
      [COLLAPSED_HEIGHT, EXPANDED_HEIGHT, FULLSCREEN_HEIGHT],
      Extrapolation.CLAMP
    )
    const opacity = interpolate(isOpen.value, [0, 0.5, 1], [0, 0, 1], Extrapolation.CLAMP)
    return {
      top: containerHeight + 8,
      opacity,
      pointerEvents: isOpen.value > 0.5 ? 'auto' : 'none',
    }
  })

  const animatedHandleStyle = useAnimatedStyle(() => {
    const baseWidth = interpolate(expansion.value, [0, 1], [36, 44], Extrapolation.CLAMP)
    const width = interpolate(
      fullscreenProgress.value,
      [0, 1],
      [baseWidth, 28],
      Extrapolation.CLAMP
    )
    const height = interpolate(
      fullscreenProgress.value,
      [0, 1],
      [4, 28],
      Extrapolation.CLAMP
    )
    const borderRadius = interpolate(
      fullscreenProgress.value,
      [0, 1],
      [2, 14],
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

  const animatedHorizontalStyle = useAnimatedStyle(() => {
    const opacity = interpolate(expansion.value, [0, 0.3], [1, 0], Extrapolation.CLAMP)
    return {
      opacity,
      pointerEvents: expansion.value < 0.3 ? 'auto' : 'none',
    }
  })

  const animatedVerticalStyle = useAnimatedStyle(() => {
    const opacity = interpolate(expansion.value, [0.3, 0.6], [0, 1], Extrapolation.CLAMP)
    return {
      opacity,
      pointerEvents: expansion.value > 0.3 ? 'auto' : 'none',
    }
  })

  return (
    <>
      <Animated.View
        style={[StyleSheet.absoluteFill, { zIndex: 998 }, animatedBackdropStyle]}
      >
        <BlurView intensity={20} position="absolute" inset={0} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

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
          containerStyle={{ flex: 1, width: '100%', height: '100%' }}
        >
          <YStack flex={1} pt={insets.top} px="$4" pb="$3">
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
                      onPress={() => handleItemPress(item.id)}
                    />
                  ))}
                </XStack>
              </Animated.View>

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
                        onPress={() => handleItemPress(item.id)}
                        onRemove={handleRemoveItem}
                        onSwipeableRef={(id, ref) => {
                          if (ref) {
                            swipeableRefs.current.set(id, ref)
                          } else {
                            swipeableRefs.current.delete(id)
                          }
                        }}
                      />
                    ))}
                  </View>
                </Animated.ScrollView>
              </Animated.View>
            </View>
          </YStack>
        </GlassView>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              alignItems: 'center',
              zIndex: 1001,
            },
            animatedFloatingHandleStyle,
          ]}
        >
          <Animated.View style={animatedHandleContainerStyle}>
            <View
              width={60}
              height={32}
              items="center"
              justify="flex-start"
              hitSlop={{ top: 15, bottom: 15, left: 30, right: 30 }}
            >
              <Animated.View
                style={[
                  {
                    backgroundColor: 'rgba(126, 126, 126, 0.9)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  animatedHandleStyle,
                ]}
              >
                <Animated.View style={animatedChevronStyle}>
                  <CaretDownIcon size={14} color="white" />
                </Animated.View>
              </Animated.View>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
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
        <Icon size={24} color="$color12" />
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
  onSwipeableRef?: (id: string, ref: SwipeableMethods | null) => void
}

const QuickMenuRow = ({ item, onPress, onRemove, onSwipeableRef }: QuickMenuRowProps) => {
  const Icon = item.icon
  const swipeableRef = useRef<SwipeableMethods>(null)

  useEffect(() => {
    if (onSwipeableRef && swipeableRef.current) {
      onSwipeableRef(item.id, swipeableRef.current)
    }
    return () => {
      if (onSwipeableRef) {
        onSwipeableRef(item.id, null)
      }
    }
  }, [item.id, onSwipeableRef])

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
          ref={swipeableRef}
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
              <Icon size={20} color="$color12" />
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
