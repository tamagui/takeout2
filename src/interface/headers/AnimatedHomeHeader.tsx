import { BlurView } from 'expo-blur'
import { useCallback } from 'react'
import { StyleSheet, Text } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SizableText, useTheme, View, XStack } from 'tamagui'

import { useIsDark } from '~/features/theme/useIsDark'
import { dialogEmit } from '~/interface/dialogs/shared'
import { BellIcon } from '~/interface/icons/phosphor/BellIcon'
import { CaretDownIcon } from '~/interface/icons/phosphor/CaretDownIcon'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'

import { Pressable } from '../buttons/Pressable'
import { isSmallScreen } from '../dimensions'
import { GradientBlurView } from '../effects/GradientBlurView'
import { FastSquircleView } from '../view/FastSquircleView'

const HEADER_HEIGHT = 44

interface AnimatedHomeHeaderProps {
  scrollY: SharedValue<number>
}

export function AnimatedHomeHeader({ scrollY }: AnimatedHomeHeaderProps) {
  const insets = useSafeAreaInsets()
  const isDark = useIsDark()
  const totalHeaderHeight = HEADER_HEIGHT + insets.top
  const prevScrollY = useSharedValue(0)
  const headerOffset = useSharedValue(0)
  const theme = useTheme()

  // track scroll direction and update header offset
  useDerivedValue(() => {
    const diff = scrollY.value - prevScrollY.value
    prevScrollY.value = scrollY.value

    // at top - always show
    if (scrollY.value <= 0) {
      headerOffset.value = withTiming(0, { duration: 200 })
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
  }, [])

  const handleFeedPress = useCallback(() => {
    // todo: show feed dropdown
  }, [])

  return (
    <>
      <GradientBlurView
        intensity={30}
        tint={isDark ? 'dark' : 'light'}
        width="100%"
        height={isSmallScreen ? 30 : 60}
        transform="rotate(180deg)"
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
        <BlurView
          intensity={30}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <XStack flex={1} items="center" justify="space-between" px="$3" pb="$2">
          {/* left - plus button */}
          <Pressable
            onPress={handlePlusPress}
            width={40}
            height={40}
            items="center"
            justify="center"
          >
            <PlusIcon size={24} color="white" />
          </Pressable>

          {/* center - feed with dropdown */}
          <Pressable
            onPress={handleFeedPress}
            flexDirection="row"
            items="center"
            gap="$2"
          >
            <SizableText fontSize="$6" fontWeight="700" color="$color">
              Takeout
            </SizableText>
            <CaretDownIcon size={16} color="white" />
          </Pressable>

          {/* right - notification bell */}
          <FastSquircleView width={40} height={40} rounded={16} bg="$color01">
            <Pressable
              onPress={handleBellPress}
              width={40}
              height={40}
              items="center"
              justify="center"
            >
              <BellIcon size={24} color="white" />
            </Pressable>
          </FastSquircleView>
        </XStack>
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
})
