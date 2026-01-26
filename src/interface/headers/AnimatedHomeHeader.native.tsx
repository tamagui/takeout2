import { useEmitter } from '@take-out/helpers'
import { memo, useCallback } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SizableText, useTheme, XStack } from 'tamagui'

import { dialogEmit } from '~/interface/dialogs/shared'
import { BlurView } from '~/interface/effects/BlurView'
import { BellIcon } from '~/interface/icons/phosphor/BellIcon'
import { CaretDownIcon } from '~/interface/icons/phosphor/CaretDownIcon'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'

import { Pressable } from '../buttons/Pressable'
import { isSmallScreen } from '../dimensions'
import { GradientBlurView } from '../effects/GradientBlurView'
import { showToast } from '../toast/helpers'
import { feedDropdownEmitter } from './feedDropdownEmitter'

const ANIMATION_DURATION = 300

const HEADER_HEIGHT = 44

interface AnimatedHomeHeaderProps {
  scrollY: SharedValue<number>
}

export const AnimatedHomeHeader = memo(({ scrollY }: AnimatedHomeHeaderProps) => {
  const insets = useSafeAreaInsets()
  const totalHeaderHeight = HEADER_HEIGHT + insets.top
  const prevScrollY = useSharedValue(0)
  const headerOffset = useSharedValue(0)
  const dropdownOpen = useSharedValue(0)
  const theme = useTheme()

  useEmitter(feedDropdownEmitter, (open) => {
    dropdownOpen.value = withTiming(open ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
  })

  // track scroll direction and update header offset
  useDerivedValue(() => {
    const diff = scrollY.value - prevScrollY.value
    prevScrollY.value = scrollY.value

    // at top - always show
    if (scrollY.value <= 0) {
      headerOffset.value = withTiming(0, { duration: 200 })
      return
    }

    // ignore large jumps (layout changes, not user scrolling)
    if (Math.abs(diff) > 100) {
      return
    }

    // scrolling down (finger moving up, content going up) - hide
    if (diff > 2) {
      headerOffset.value = withTiming(-totalHeaderHeight, { duration: 200 })
    }
    // scrolling up (finger moving down, content going down) - show
    else if (diff < -2) {
      headerOffset.value = withTiming(0, { duration: 200 })
    }
  })

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: headerOffset.value }],
    }
  })

  const handlePlusPress = useCallback(() => {
    dialogEmit({ type: 'create-post' })
  }, [])

  const handleBellPress = useCallback(() => {
    // todo: navigate to notifications
    showToast('Coming soon', { type: 'info' })
  }, [])

  const handleFeedPress = useCallback(() => {
    feedDropdownEmitter.emit(true)
    dropdownOpen.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
  }, [dropdownOpen])

  const animatedCaretStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${dropdownOpen.value * 180}deg` }],
    }
  })

  return (
    <>
      <GradientBlurView
        intensity={20}
        width="100%"
        height={isSmallScreen ? 30 : 60}
        inverted
        t={0}
        z={999}
      />
      <Animated.View
        style={[
          { backgroundColor: theme.background04.val },
          { paddingTop: insets.top, height: totalHeaderHeight, zIndex: 999 },
          StyleSheet.absoluteFillObject,
          animatedHeaderStyle,
        ]}
      >
        <BlurView intensity={60} position="absolute" inset={0} />
        <XStack flex={1} items="center" justify="space-between" px="$3" pb="$2">
          <Pressable
            onPress={handlePlusPress}
            width={40}
            height={40}
            items="center"
            justify="center"
          >
            <PlusIcon size={24} color="$color12" />
          </Pressable>

          <Pressable
            onPress={handleFeedPress}
            flexDirection="row"
            items="center"
            gap="$2"
          >
            <SizableText fontSize="$6" fontWeight="700" color="$color">
              Takeout
            </SizableText>
            <Animated.View style={animatedCaretStyle}>
              <CaretDownIcon size={16} color="$color12" />
            </Animated.View>
          </Pressable>

          <Pressable
            onPress={handleBellPress}
            width={40}
            height={40}
            items="center"
            justify="center"
          >
            <BellIcon size={22} color="$color12" />
          </Pressable>
        </XStack>
      </Animated.View>
    </>
  )
})
