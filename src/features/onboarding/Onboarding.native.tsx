import { BlurView } from 'expo-blur'
import { useCallback, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import PagerView, {
  type PagerViewOnPageScrollEvent,
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { H1, Theme, View, YStack, type ThemeName } from 'tamagui'

import { OnboardingActionButton } from './OnboardingActionButton'
import { OnboardingPageIndicator } from './OnboardingPageIndicator'
import { OnboardingSlide } from './OnboardingSlide'

import type { OnboardingProps } from './types'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

const TITLE_HEIGHT = 48

export function Onboarding({ slides, onComplete }: OnboardingProps) {
  const pagerRef = useRef<PagerView>(null)
  const safeAreaInsets = useSafeAreaInsets()

  const scrollPosition = useSharedValue(0)
  const currentPage = useSharedValue(0)

  const [currentTheme, setCurrentTheme] = useState<ThemeName>(slides[0]?.theme ?? 'blue')
  const [pageIndex, setPageIndex] = useState(0)

  const onPageScroll = useCallback((e: PagerViewOnPageScrollEvent) => {
    const { position, offset } = e.nativeEvent
    scrollPosition.value = position + offset
  }, [])

  const onPageSelected = useCallback(
    (e: PagerViewOnPageSelectedEvent) => {
      const page = e.nativeEvent.position
      currentPage.value = page
      setPageIndex(page)
      const slide = slides[page]
      if (slide) {
        setCurrentTheme(slide.theme)
      }
    },
    [slides]
  )

  const goToNextPage = useCallback(() => {
    const nextPage = Math.min(pageIndex + 1, slides.length - 1)
    pagerRef.current?.setPage(nextPage)
  }, [pageIndex, slides.length])

  const handleActionPress = useCallback(() => {
    if (pageIndex === slides.length - 1) {
      onComplete?.()
    } else {
      goToNextPage()
    }
  }, [pageIndex, slides.length, onComplete, goToNextPage])

  const blurAnimatedProps = useAnimatedProps(() => {
    const offset = scrollPosition.value - Math.floor(scrollPosition.value)
    const intensity = interpolate(offset, [0, 0.5, 1], [0, 80, 0], Extrapolation.CLAMP)
    return { intensity }
  })

  const blurOverlayStyle = useAnimatedStyle(() => {
    const offset = scrollPosition.value - Math.floor(scrollPosition.value)
    const opacity = interpolate(
      offset,
      [0, 0.2, 0.8, 1],
      [0, 1, 1, 0],
      Extrapolation.CLAMP
    )
    return { opacity }
  })

  return (
    <Theme name={currentTheme}>
      <View flex={1}>
        <YStack flex={1} bg="$color2" pt={safeAreaInsets.top}>
          <TitleTicker slides={slides} scrollPosition={scrollPosition} />

          <PagerView
            ref={pagerRef}
            style={{ flex: 1 }}
            initialPage={0}
            onPageScroll={onPageScroll}
            onPageSelected={onPageSelected}
            overdrag
          >
            {slides.map((slide, index) => (
              <View key={slide.id} flex={1}>
                <OnboardingSlide
                  index={index}
                  slide={slide}
                  scrollPosition={scrollPosition}
                  currentPage={currentPage}
                />
              </View>
            ))}
          </PagerView>

          <YStack pb={safeAreaInsets.bottom + 16} px="$5" gap="$4">
            <OnboardingPageIndicator
              totalPages={slides.length}
              scrollPosition={scrollPosition}
            />

            <OnboardingActionButton
              currentPage={currentPage}
              totalPages={slides.length}
              onPress={handleActionPress}
              onSkip={onComplete}
            />
          </YStack>
        </YStack>

        {/* <Animated.View
          style={[{ ...StyleSheet.absoluteFillObject, zIndex: 100 }, blurOverlayStyle]}
          pointerEvents="none"
        >
          <AnimatedBlurView
            animatedProps={blurAnimatedProps}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        </Animated.View> */}
      </View>
    </Theme>
  )
}

interface TitleTickerProps {
  slides: OnboardingProps['slides']
  scrollPosition: SharedValue<number>
}

function TitleTicker({ slides, scrollPosition }: TitleTickerProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollPosition.value,
      [0, slides.length - 1],
      [0, -(slides.length - 1) * TITLE_HEIGHT],
      Extrapolation.CLAMP
    )
    return {
      transform: [{ translateY }],
    }
  })

  const opacityStyle = useAnimatedStyle(() => {
    const offset = scrollPosition.value - Math.floor(scrollPosition.value)
    const shouldAnimate = offset > 0.01 && offset < 0.99
    const opacity = shouldAnimate
      ? interpolate(offset, [0, 0.5, 0.99], [1, 0, 1], Extrapolation.CLAMP)
      : 1
    return { opacity }
  })

  return (
    <Animated.View
      style={[{ height: TITLE_HEIGHT, overflow: 'hidden', marginTop: 16 }, opacityStyle]}
    >
      <Animated.View style={animatedStyle}>
        {slides.map((slide) => (
          <View key={slide.id} style={{ height: TITLE_HEIGHT, justifyContent: 'center' }}>
            <H1 color="$color12" fontWeight="800" size="$9" lineHeight="$9" px="$5">
              {slide.title}
            </H1>
          </View>
        ))}
      </Animated.View>
    </Animated.View>
  )
}
