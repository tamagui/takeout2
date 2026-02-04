import { usePathname } from 'one'
import { useCallback, useEffect, useState } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scheduleOnRN } from 'react-native-worklets'
import { View } from 'tamagui'

import { BlurView } from '~/interface/effects/BlurView'
import {
  lightImpact,
  mediumImpact,
  rigidImpact,
  softImpact,
} from '~/interface/haptics/haptics'
import { GearIcon } from '~/interface/icons/phosphor/GearIcon'
import { HouseIcon } from '~/interface/icons/phosphor/HouseIcon'
import { MagnifyingGlassIcon } from '~/interface/icons/phosphor/MagnifyingGlassIcon'
import { PencilSimpleIcon } from '~/interface/icons/phosphor/PencilSimpleIcon'
import { SparkleIcon } from '~/interface/icons/phosphor/SparkleIcon'
import { UserIcon } from '~/interface/icons/phosphor/UserIcon'

import { Pressable } from '../../interface/buttons/Pressable'
import { dialogEmit } from '../../interface/dialogs/shared'
import { GlassView } from '../../interface/effects/GlassView'
import { AnimatedTab } from '../../interface/navigation/AnimatedTab'
import { ExpandedMenuItem } from '../../interface/navigation/ExpandedMenuItem'

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import type { IconComponent } from '~/interface/icons/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const ANIMATION_DURATION = 400

export interface ExpandedMenuItemType {
  icon: IconComponent
  label: string
  route: string
}

const EXPANDED_MENU_ITEMS: ExpandedMenuItemType[] = [
  { icon: PencilSimpleIcon, label: 'Create Post', route: 'create-post' },
  { icon: MagnifyingGlassIcon, label: 'Search', route: 'search' },
  { icon: GearIcon, label: 'Settings', route: 'settings' },
]

const ALL_TABS = [
  { name: 'feed', icon: HouseIcon, hideTabBar: false },
  { name: 'ai', icon: SparkleIcon, hideTabBar: true },
  { name: 'search', icon: MagnifyingGlassIcon, hideTabBar: false },
  { name: 'profile', icon: UserIcon, hideTabBar: false },
]

interface TabBarProps extends BottomTabBarProps {
  onExpandedMenuPress?: (index: number) => void
}

const TAB_COUNT = ALL_TABS.length

export function TabBar({ state, navigation, onExpandedMenuPress }: TabBarProps) {
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const animationProgress = useSharedValue(0)
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  const activeTabIndex = useSharedValue(0)
  const tabBarVisibility = useSharedValue(1)

  const currentTabName = state.routes[state.index]?.name
  const currentTabIndex = ALL_TABS.findIndex((tab) => tab.name === currentTabName)
  const currentTab = ALL_TABS[currentTabIndex]
  const shouldHideTabBar =
    (currentTab?.hideTabBar ||
      pathname.startsWith('/home/feed/post/') ||
      pathname.startsWith('/home/profile/post/')) ??
    false

  useEffect(() => {
    if (currentTabIndex >= 0) {
      activeTabIndex.value = withSpring(currentTabIndex, {
        damping: 30,
        stiffness: 680,
        mass: 0.8,
      })

      // for tabs that hide the bar, wait for indicator animation then hide
      if (shouldHideTabBar) {
        const timeout = setTimeout(() => {
          tabBarVisibility.value = withTiming(0, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          })
        }, 350)
        return () => clearTimeout(timeout)
      }
    }
  }, [currentTabIndex, activeTabIndex, shouldHideTabBar, tabBarVisibility])

  useEffect(() => {
    // show tab bar immediately when switching to visible tabs
    if (!shouldHideTabBar) {
      tabBarVisibility.value = withTiming(1, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    }
  }, [shouldHideTabBar, tabBarVisibility])

  useEffect(() => {
    if (isExpanded) {
      lightImpact()
    }
  }, [selectedMenuIndex, isExpanded])

  const updateSelectedIndex = useCallback((index: number) => {
    setSelectedMenuIndex(index)
  }, [])

  const setExpandedState = useCallback((expanded: boolean) => {
    setIsExpanded(expanded)
  }, [])

  const collapseMenu = useCallback(() => {
    softImpact()
    animationProgress.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
    setIsExpanded(false)
  }, [animationProgress])

  const navigateToRoute = useCallback(
    (route: string) => {
      if (route === 'create-post') {
        dialogEmit({ type: 'create-post' })
      } else {
        navigation.navigate(route)
      }
    },
    [navigation]
  )

  const expandMenu = useCallback(() => {
    mediumImpact()
    animationProgress.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
    setIsExpanded(true)
  }, [animationProgress])

  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onStart(() => {
      scheduleOnRN(expandMenu)
    })

  const panGesture = Gesture.Pan()
    .onStart(() => {
      scheduleOnRN(rigidImpact)
    })
    .onUpdate((event) => {
      if (animationProgress.value > 0.8) {
        const menuHeight = 200
        const itemHeight = menuHeight / EXPANDED_MENU_ITEMS.length
        const relativeY = event.y

        let newIndex = Math.floor(relativeY / itemHeight)
        newIndex = Math.max(0, Math.min(EXPANDED_MENU_ITEMS.length - 1, newIndex))
        scheduleOnRN(updateSelectedIndex, newIndex)
      }
    })
    .onEnd((event) => {
      const velocity = event.velocityY
      const threshold = 500

      if (animationProgress.value > 0.7) {
        const menuItem = EXPANDED_MENU_ITEMS[selectedMenuIndex]
        if (menuItem) {
          scheduleOnRN(navigateToRoute, menuItem.route)
        }
        animationProgress.value = withTiming(0, {
          duration: ANIMATION_DURATION,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
        scheduleOnRN(setExpandedState, false)
      } else if (velocity < -threshold && animationProgress.value === 0) {
        animationProgress.value = withTiming(1, {
          duration: ANIMATION_DURATION,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
        scheduleOnRN(setExpandedState, true)
      } else if (velocity > threshold && animationProgress.value === 1) {
        animationProgress.value = withTiming(0, {
          duration: ANIMATION_DURATION,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
        scheduleOnRN(setExpandedState, false)
      }
      scheduleOnRN(lightImpact)
    })

  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture)

  const animatedTabBarStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animationProgress.value,
      [0, 0.5, 1],
      [1, 0.5, 1],
      Extrapolation.CLAMP
    )
    const translateY = interpolate(
      animationProgress.value,
      [0, 0.5, 1],
      [0, -10, -20],
      Extrapolation.CLAMP
    )
    return {
      transform: [{ scale }, { translateY }],
    }
  })

  const animatedFloatingBarStyle = useAnimatedStyle(() => {
    const height = interpolate(
      animationProgress.value,
      [0, 0.4, 0.7, 1],
      [50, 50, 150, 200],
      Extrapolation.CLAMP
    )
    const borderRadius = interpolate(
      animationProgress.value,
      [0, 0.2, 1],
      [25, 50, 32],
      Extrapolation.CLAMP
    )
    return {
      height,
      borderRadius,
      width: SCREEN_WIDTH - 150,
    }
  })

  const animatedOriginalTabBarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animationProgress.value,
      [0, 0.25, 0.4],
      [1, 0.2, 0],
      Extrapolation.CLAMP
    )
    return {
      opacity,
      pointerEvents: animationProgress.value > 0.25 ? 'none' : 'auto',
    }
  })

  const animatedBackdropBlurStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animationProgress.value,
      [0, 0.4, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    )
    return {
      opacity,
      pointerEvents: animationProgress.value > 0.3 ? 'auto' : 'none',
    }
  })

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const containerWidth = SCREEN_WIDTH - 150
    const tabWidth = containerWidth / TAB_COUNT
    const indicatorWidth = tabWidth - 10
    const offset = (tabWidth - indicatorWidth) / 2
    return {
      transform: [{ translateX: activeTabIndex.value * tabWidth + offset }],
      width: indicatorWidth,
    }
  })

  const animatedTabBarVisibilityStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      tabBarVisibility.value,
      [0, 1],
      [100, 0],
      Extrapolation.CLAMP
    )
    const opacity = interpolate(
      tabBarVisibility.value,
      [0, 0.5, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    )
    return {
      transform: [{ translateY }],
      opacity,
      pointerEvents: tabBarVisibility.value > 0.5 ? 'auto' : 'none',
    }
  })

  const handleMenuItemPress = (index: number) => {
    onExpandedMenuPress?.(index)
    const selectedItem = EXPANDED_MENU_ITEMS[index]
    if (!selectedItem) return
    setSelectedMenuIndex(index)

    // handle create-post specially - open modal instead of navigating
    if (selectedItem.route === 'create-post') {
      dialogEmit({ type: 'create-post' })
    } else {
      navigation.navigate(selectedItem.route)
    }

    animationProgress.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
    setIsExpanded(false)
  }

  return (
    <>
      <Animated.View
        style={[
          { ...StyleSheet.absoluteFillObject, zIndex: 5 },
          animatedBackdropBlurStyle,
        ]}
      >
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={collapseMenu} />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            alignItems: 'center',
            bottom: insets.bottom - 8 || 10,
            zIndex: 10,
          },
          animatedTabBarVisibilityStyle,
        ]}
      >
        <GestureDetector gesture={composedGesture}>
          <View>
            <Animated.View
              style={[
                {
                  overflow: 'hidden',
                  backgroundColor: 'transparent',
                  boxShadow: '0 20px 30px rgba(0,0,0,0.35)',
                },
                animatedFloatingBarStyle,
                animatedTabBarStyle,
              ]}
            >
              <GlassView
                intensity={90}
                glassEffectStyle="regular"
                borderRadius={32}
                containerStyle={{
                  flex: 1,
                  width: '100%',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <View flex={1} p="$2" pb="$1" justify="flex-start" gap="$2">
                  {EXPANDED_MENU_ITEMS.map((item, index) => (
                    <ExpandedMenuItem
                      key={item.route}
                      item={item}
                      index={index}
                      animationProgress={animationProgress}
                      totalItems={EXPANDED_MENU_ITEMS.length}
                      isSelected={selectedMenuIndex === index}
                      onPress={() => handleMenuItemPress(index)}
                    />
                  ))}
                </View>

                <Animated.View
                  style={[
                    { flexDirection: 'row', height: 50, position: 'relative' },
                    animatedOriginalTabBarStyle,
                  ]}
                >
                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        top: 5,
                        left: 0,
                        bottom: 5,
                        borderRadius: 100,
                        backgroundColor: 'rgba(126, 126, 126, 0.2)',
                      },
                      animatedIndicatorStyle,
                    ]}
                  />
                  {ALL_TABS.map((tab) => {
                    const isFocused = currentTabName === tab.name

                    const onPress = () => {
                      const route = state.routes.find((r) => r.name === tab.name)
                      if (route) {
                        const event = navigation.emit({
                          type: 'tabPress',
                          target: route.key,
                          canPreventDefault: true,
                        })
                        if (!isFocused && !event.defaultPrevented) {
                          navigation.navigate(tab.name)
                        }
                      }
                    }

                    const onLongPress = () => {
                      const route = state.routes.find((r) => r.name === tab.name)
                      if (route) {
                        navigation.emit({
                          type: 'tabLongPress',
                          target: route.key,
                        })
                      }
                    }

                    return (
                      <AnimatedTab
                        key={tab.name}
                        isFocused={isFocused}
                        icon={tab.icon}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        animationProgress={animationProgress}
                      />
                    )
                  })}
                </Animated.View>
              </GlassView>
            </Animated.View>
          </View>
        </GestureDetector>
      </Animated.View>
    </>
  )
}
