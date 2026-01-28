import { useRef, useState } from 'react'
import PagerView, {
  type PagerViewOnPageScrollEvent,
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Theme, View, YStack, type ThemeName } from 'tamagui'

import { OnboardingActionButton } from './OnboardingActionButton'
import { OnboardingPageIndicator } from './OnboardingPageIndicator'
import { OnboardingSlide } from './OnboardingSlide'
import { onboardingSlides } from './onboardingSlides'

const TITLE_HEIGHT = 48

export function Onboarding({ onComplete }: { onComplete?: () => void }) {
  const slides = onboardingSlides
  const pagerRef = useRef<PagerView>(null)
  const safeAreaInsets = useSafeAreaInsets()

  const scrollPosition = useSharedValue(0)
  const currentPage = useSharedValue(0)

  const [currentTheme, setCurrentTheme] = useState<ThemeName>(slides[0]?.theme ?? 'blue')
  const [pageIndex, setPageIndex] = useState(0)

  const onPageScroll = (e: PagerViewOnPageScrollEvent) => {
    const { position, offset } = e.nativeEvent
    scrollPosition.value = position + offset
  }

  const onPageSelected = (e: PagerViewOnPageSelectedEvent) => {
    const page = e.nativeEvent.position
    currentPage.value = page
    setPageIndex(page)
    const slide = slides[page]
    if (slide) {
      setCurrentTheme(slide.theme)
    }
  }

  const goToNextPage = () => {
    const nextPage = Math.min(pageIndex + 1, slides.length - 1)
    currentPage.value = nextPage
    setPageIndex(nextPage)
    const slide = slides[nextPage]
    if (slide) {
      setCurrentTheme(slide.theme)
    }
    pagerRef.current?.setPage(nextPage)
  }

  const handleActionPress = () => {
    if (pageIndex === slides.length - 1) {
      onComplete?.()
    } else {
      goToNextPage()
    }
  }

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
              isLastPage={pageIndex === slides.length - 1}
              onPress={handleActionPress}
              onSkip={onComplete}
            />
          </YStack>
        </YStack>
      </View>
    </Theme>
  )
}

interface TitleTickerProps {
  slides: typeof onboardingSlides
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
          <View
            key={slide.id}
            style={{ height: TITLE_HEIGHT, justifyContent: 'center' }}
          />
        ))}
      </Animated.View>
    </Animated.View>
  )
}
