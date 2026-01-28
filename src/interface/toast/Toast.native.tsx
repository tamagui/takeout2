import { useEmitter } from '@take-out/helpers'
import { isAndroid } from '@tamagui/constants'
import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated, {
  SlideInUp,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scheduleOnRN } from 'react-native-worklets'
import {
  SizableText,
  Theme,
  useTheme,
  useWindowDimensions,
  View,
  XStack,
  YStack,
  type ThemeName,
} from 'tamagui'

import { GlassView } from '~/interface/effects/GlassView'

import { Pressable } from '../buttons/Pressable'
import { toastEmitter } from './emitter'

import type { ToastData, ToastType } from './types'

const BANNER_HEIGHT = 78
const TOP_OFFSET = 12
const EXPANDED_HEIGHT = 400
const RESISTANCE_FACTOR = 0.15
const DEFAULT_DURATION = 3000
const DISMISS_THRESHOLD = BANNER_HEIGHT / 2
const VELOCITY_THRESHOLD = 500
const DRAG_THRESHOLD = 30
const SLIDE_UP_DISTANCE = BANNER_HEIGHT + TOP_OFFSET

function getThemeForType(type?: ToastType): ThemeName | null {
  switch (type) {
    case 'error':
      return 'red'
    case 'warn':
      return 'yellow'
    case 'success':
      return 'green'
    case 'info':
    default:
      return null
  }
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const createEnteringAnimation = () =>
  SlideInUp.withInitialValues({
    originY: -SLIDE_UP_DISTANCE * 2,
  }).springify()

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastData | null>(null)
  const toastIdRef = useRef(0)

  useEmitter(toastEmitter, (val) => {
    if (val.type === 'hide') {
      setToast(null)
    } else {
      setToast({ ...val.toast, id: toastIdRef.current++ })
    }
  })

  return (
    <>
      {children}
      <View position="absolute" t={0} l={0} r={0} b={0} pointerEvents="box-none">
        {toast && (
          <ToastBanner key={toast.id} toast={toast} onHide={() => setToast(null)} />
        )}
      </View>
    </>
  )
}

interface ToastBannerProps {
  toast: ToastData
  onHide: () => void
}

const ToastBanner = memo(({ toast, onHide }: ToastBannerProps) => {
  const { top } = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const { color02 } = useTheme()

  const translateY = useSharedValue(0)
  const hidden = useSharedValue(false)
  const isDragging = useSharedValue(false)
  const scheduleHide = useSharedValue(0)
  const hasExceededThreshold = useSharedValue(false)
  const mounted = useSharedValue(false)
  const height = useSharedValue(BANNER_HEIGHT)

  const duration = toast.duration ?? DEFAULT_DURATION
  const toastType = toast.type
  const themeName = getThemeForType(toastType)
  const expandedChild = toast.expandedChild
  const action = toast.action
  const isExpandable = useSharedValue(!!expandedChild)

  const EXPANDED_TOP = windowHeight / 2 - EXPANDED_HEIGHT / 2 - top

  const notExpanded = useDerivedValue(() => !hasExceededThreshold.value)

  useEffect(() => {
    mounted.value = true
    return () => {
      mounted.value = false
    }
  }, [mounted])

  const toggleExpand = (expand: boolean) => {
    'worklet'
    const target = expand ? EXPANDED_HEIGHT : BANNER_HEIGHT
    height.value = withSpring(target)
  }

  const hide = useCallback(() => {
    onHide()
  }, [onHide])

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .maxPointers(1)
    .onBegin(() => {
      isDragging.value = true
    })
    .onUpdate((e) => {
      if (hidden.value || hasExceededThreshold.value) return
      if (e.translationY > 0) {
        translateY.value = e.translationY * RESISTANCE_FACTOR
        if (translateY.value > DRAG_THRESHOLD && isExpandable.value) {
          hasExceededThreshold.value = true
        }
      } else {
        translateY.value = e.translationY
      }
    })
    .onEnd((e) => {
      isDragging.value = false
      if (hasExceededThreshold.value) return
      if (translateY.value < -DISMISS_THRESHOLD || e.velocityY < -VELOCITY_THRESHOLD) {
        hidden.value = true
      } else {
        translateY.value = withSpring(0)
      }
    })

  // auto-hide scheduling
  useAnimatedReaction(
    () => isDragging.value,
    (current) => {
      if (hidden.value) return
      if (current) {
        scheduleHide.value = 0
      } else if (!hasExceededThreshold.value) {
        scheduleHide.value = withTiming(1, { duration }, (finished) => {
          if (finished) {
            hidden.value = true
          }
        })
      }
    }
  )

  // reset on hide - animate out first, then remove
  useAnimatedReaction(
    () => hidden.value,
    (current) => {
      if (current) {
        hasExceededThreshold.value = false
        // collapse first if expanded
        height.value = withSpring(BANNER_HEIGHT)
        // animate to hidden position, then call hide
        translateY.value = withSpring(
          -SLIDE_UP_DISTANCE - top - TOP_OFFSET,
          { damping: 20, stiffness: 300 },
          (finished) => {
            if (finished) {
              scheduleOnRN(hide)
            }
          }
        )
      }
    }
  )

  // expand/collapse animation
  useAnimatedReaction(
    () => hasExceededThreshold.value,
    (current) => {
      if (hidden.value) return
      if (current) {
        translateY.value = withSpring(EXPANDED_TOP)
        toggleExpand(true)
      } else {
        translateY.value = withSpring(0)
        toggleExpand(false)
      }
    }
  )

  const animatedStyle = useAnimatedStyle(() => {
    const isHidden = hidden.value
    const maxHeight = windowHeight - EXPANDED_TOP - TOP_OFFSET - 20
    const finalHeight = Math.min(height.value, maxHeight)

    return {
      transform: [{ translateY: translateY.value }],
      opacity: withTiming(isHidden && mounted.value ? 0 : 1, { duration: 200 }),
      pointerEvents: isHidden ? 'none' : 'auto',
      height: finalHeight,
    }
  })

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    pointerEvents: hasExceededThreshold.value ? 'auto' : 'none',
    opacity: withTiming(hasExceededThreshold.value ? 1 : 0, { duration: 200 }),
  }))

  const peekAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withSpring(notExpanded.value ? 1 : 0),
  }))

  const expandedAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withSpring(hasExceededThreshold.value ? 1 : 0),
  }))

  const handlePress = () => {
    if (action) {
      hidden.value = true
      action.onPress()
    }
  }

  const handleOverlayPress = () => {
    hidden.value = true
  }

  return (
    <Theme name={themeName}>
      <GestureHandlerRootView
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="box-none"
      >
        {/* blur overlay for expanded state */}
        <AnimatedPressable
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
            },
            overlayAnimatedStyle,
          ]}
          onPress={handleOverlayPress}
        />

        <Animated.View
          entering={createEnteringAnimation()}
          style={[
            {
              top: top + TOP_OFFSET,
              position: 'absolute',
              left: 16,
              right: 16,
              zIndex: 9999,
            },
            animatedStyle,
          ]}
        >
          <GestureDetector gesture={panGesture}>
            <Pressable onPress={handlePress} flex={1}>
              <GlassView
                borderRadius={24}
                intensity={50}
                containerStyle={{ flex: 1, overflow: 'hidden' }}
              >
                {/* peek view (collapsed state) */}
                <Animated.View
                  style={[{ backgroundColor: color02.val, flex: 1 }, peekAnimatedStyle]}
                >
                  <YStack flex={1} justify="center" px="$4" py="$3" gap="$1">
                    <SizableText
                      size="$4"
                      fontWeight="600"
                      color="$color12"
                      numberOfLines={1}
                    >
                      {toast.title}
                    </SizableText>
                    {toast.message && (
                      <SizableText size="$3" color="$color11" numberOfLines={2}>
                        {toast.message}
                      </SizableText>
                    )}
                  </YStack>
                  {action && (
                    <XStack pr="$3" items="center">
                      <SizableText size="$3" color="$color10" fontWeight="500">
                        {action.label}
                      </SizableText>
                    </XStack>
                  )}
                  {/* drag handle indicator */}
                  {expandedChild && (
                    <View
                      bg="$color11"
                      position="absolute"
                      b={6}
                      l="50%"
                      ml={-20}
                      width={40}
                      height={4}
                      rounded={2}
                    />
                  )}
                </Animated.View>

                {/* expanded view */}
                {expandedChild && (
                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        margin: 1,
                        overflow: 'hidden',
                        borderRadius: 24,
                      },
                      expandedAnimatedStyle,
                    ]}
                  >
                    <View
                      flex={1}
                      bg="$background08"
                      {...(isAndroid && {
                        borderWidth: 1,
                        borderColor: '$borderColor',
                        rounded: 24,
                      })}
                    >
                      {expandedChild}
                    </View>
                  </Animated.View>
                )}
              </GlassView>
            </Pressable>
          </GestureDetector>
        </Animated.View>
      </GestureHandlerRootView>
    </Theme>
  )
})
