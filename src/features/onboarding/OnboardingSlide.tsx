import { memo } from 'react'
import { useWindowDimensions } from 'react-native'
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { SizableText, View, YStack } from 'tamagui'

import { GlassView } from '~/interface/effects/GlassView'

import type {
  AnimatedCardWrapperProps,
  AnimatedLayoutProps,
  FeatureCardProps,
  LayoutProps,
  OnboardingSlideProps,
} from './types'

export const OnboardingSlide = memo(function OnboardingSlide({
  index,
  slide,
  scrollPosition,
  currentPage,
}: OnboardingSlideProps) {
  const { width: screenWidth } = useWindowDimensions()

  const { features, layout } = slide

  // container scale and opacity animation
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const distance = scrollPosition.value - index
    const absDistance = Math.abs(distance)

    return {
      transform: [
        { scale: interpolate(absDistance, [0, 1], [1, 0.9], Extrapolation.CLAMP) },
      ],
      opacity: interpolate(absDistance, [0, 1], [1, 0.5], Extrapolation.CLAMP),
    }
  })

  // content fade
  const contentAnimatedStyle = useAnimatedStyle(() => {
    const offset = scrollPosition.value - Math.floor(scrollPosition.value)
    const shouldAnimate = offset > 0.01 && offset < 0.99
    const opacity = shouldAnimate
      ? interpolate(offset, [0, 0.5, 0.99], [1, 0, 1], Extrapolation.CLAMP)
      : 1
    const translateY = shouldAnimate
      ? interpolate(offset, [0, 0.5, 0.99], [0, -15, 0], Extrapolation.CLAMP)
      : 0
    return {
      opacity,
      transform: [{ translateY }],
    }
  })

  const cardWidth = screenWidth - 48

  return (
    <View flex={1}>
      <YStack flex={1} items="center" justify="center" px="$6">
        <Animated.View style={containerAnimatedStyle}>
          <Animated.View style={contentAnimatedStyle}>
            <AnimatedLayout
              layout={layout}
              features={features}
              cardWidth={cardWidth}
              currentPage={currentPage}
              index={index}
            />
          </Animated.View>
        </Animated.View>
      </YStack>
    </View>
  )
})

interface PositionConfig {
  l?: number
  r?: number
  t: number
  rotate: string
}

interface LayoutConfig {
  positions: PositionConfig[]
  cardWidthRatio: number
  cardHeight: number
  containerHeight: number
}

const LAYOUT_CONFIGS: Record<'rotated' | 'cascade' | 'stack', LayoutConfig> = {
  rotated: {
    positions: [
      { l: 0, t: 0, rotate: '-5deg' },
      { r: 0, t: 90, rotate: '4deg' },
      { l: 10, t: 180, rotate: '-3deg' },
      { r: 10, t: 270, rotate: '5deg' },
    ],
    cardWidthRatio: 0.75,
    cardHeight: 72,
    containerHeight: 380,
  },
  cascade: {
    positions: [
      { r: 0, t: 0, rotate: '6deg' },
      { l: 0, t: 85, rotate: '-4deg' },
      { r: 5, t: 175, rotate: '3deg' },
      { l: 5, t: 265, rotate: '-5deg' },
    ],
    cardWidthRatio: 0.75,
    cardHeight: 72,
    containerHeight: 380,
  },
  stack: {
    positions: [
      { l: 0, t: 0, rotate: '0deg' },
      { l: 0, t: 78, rotate: '0deg' },
      { l: 0, t: 156, rotate: '0deg' },
      { l: 0, t: 234, rotate: '0deg' },
    ],
    cardWidthRatio: 0.72,
    cardHeight: 68,
    containerHeight: 350,
  },
}

function AnimatedLayout({
  layout,
  features,
  cardWidth,
  currentPage,
  index,
}: AnimatedLayoutProps) {
  if (layout === 'grid') {
    return (
      <GridLayout
        features={features}
        cardWidth={cardWidth}
        currentPage={currentPage}
        slideIndex={index}
      />
    )
  }

  const config = LAYOUT_CONFIGS[layout]
  const itemWidth = cardWidth * config.cardWidthRatio
  const isStack = layout === 'stack'

  return (
    <YStack width={cardWidth} height={config.containerHeight} items="center">
      {features.map((feature, i) => {
        const pos = config.positions[i]
        if (!pos) return null

        const positionStyle: Record<string, number> = {
          top: pos.t,
        }

        if (isStack) {
          positionStyle.left = (cardWidth - itemWidth) / 2
        } else if ('l' in pos && pos.l !== undefined) {
          positionStyle.left = pos.l
        } else if ('r' in pos && pos.r !== undefined) {
          positionStyle.right = pos.r
        }

        return (
          <AnimatedCardWrapper
            key={i}
            cardIndex={i}
            slideIndex={index}
            currentPage={currentPage}
            rotation={pos.rotate !== '0deg' ? pos.rotate : undefined}
            style={{
              position: 'absolute',
              ...positionStyle,
              zIndex: features.length - i,
            }}
          >
            <FeatureCard
              feature={feature}
              width={itemWidth}
              height={config.cardHeight}
              horizontal
            />
          </AnimatedCardWrapper>
        )
      })}
    </YStack>
  )
}

function AnimatedCardWrapper({
  cardIndex,
  slideIndex,
  currentPage,
  children,
  style,
  rotation,
  baseScale = 1,
}: AnimatedCardWrapperProps) {
  const delay = cardIndex * 80

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = currentPage.value === slideIndex

    const targetOpacity = isActive ? 1 : 0
    const targetScale = isActive ? 1 : 0.85
    const targetTranslateY = isActive ? 0 : 15

    return {
      opacity: withDelay(delay, withTiming(targetOpacity, { duration: 300 })),
      transform: [
        {
          scale: withDelay(delay, withTiming(targetScale * baseScale, { duration: 350 })),
        },
        { translateY: withDelay(delay, withTiming(targetTranslateY, { duration: 350 })) },
        ...(rotation ? [{ rotate: rotation }] : []),
      ],
    }
  }, [delay, baseScale, rotation, slideIndex])

  const entering = FadeIn.delay(delay).duration(300)

  return (
    <Animated.View style={[style, animatedStyle]} entering={entering}>
      {children}
    </Animated.View>
  )
}

function GridLayout({ features, cardWidth, currentPage, slideIndex }: LayoutProps) {
  const gridItemSize = (cardWidth - 24) / 2
  const rotations = ['-3deg', '2deg', '2deg', '-3deg']

  return (
    <YStack gap="$3" width={cardWidth}>
      <YStack flexDirection="row" gap="$3" justify="center">
        <AnimatedCardWrapper
          cardIndex={0}
          slideIndex={slideIndex}
          currentPage={currentPage}
          rotation={rotations[0]}
        >
          <FeatureCard feature={features[0]} size={gridItemSize} />
        </AnimatedCardWrapper>
        <AnimatedCardWrapper
          cardIndex={1}
          slideIndex={slideIndex}
          currentPage={currentPage}
          rotation={rotations[1]}
        >
          <FeatureCard feature={features[1]} size={gridItemSize} />
        </AnimatedCardWrapper>
      </YStack>
      <YStack flexDirection="row" gap="$3" justify="center">
        <AnimatedCardWrapper
          cardIndex={2}
          slideIndex={slideIndex}
          currentPage={currentPage}
          rotation={rotations[2]}
        >
          <FeatureCard feature={features[2]} size={gridItemSize} />
        </AnimatedCardWrapper>
        <AnimatedCardWrapper
          cardIndex={3}
          slideIndex={slideIndex}
          currentPage={currentPage}
          rotation={rotations[3]}
        >
          <FeatureCard feature={features[3]} size={gridItemSize} />
        </AnimatedCardWrapper>
      </YStack>
    </YStack>
  )
}

function FeatureCard({ feature, size, width, height, horizontal }: FeatureCardProps) {
  if (!feature) return null
  const { Icon, title } = feature

  const cardWidth = width ?? size ?? 100
  const cardHeight = height ?? (horizontal ? cardWidth * 0.35 : (size ?? 100))

  if (horizontal) {
    return (
      <GlassView
        borderRadius={24}
        intensity={40}
        tint="light"
        glassEffectStyle="regular"
        backgroundColor="rgba(255, 255, 255, 0.12)"
        containerStyle={{ width: cardWidth, height: cardHeight }}
      >
        <YStack flex={1} flexDirection="row" items="center" gap="$4" px="$5">
          <YStack
            width={48}
            height={48}
            items="center"
            justify="center"
            bg="$color4"
            rounded={14}
          >
            <Icon size={26} color="$color10" />
          </YStack>
          <SizableText size="$5" fontWeight="600" color="$color12">
            {title}
          </SizableText>
        </YStack>
      </GlassView>
    )
  }

  return (
    <GlassView
      borderRadius={24}
      intensity={40}
      tint="light"
      glassEffectStyle="regular"
      backgroundColor="rgba(255, 255, 255, 0.12)"
      containerStyle={{ width: cardWidth, height: cardHeight }}
    >
      <YStack flex={1} items="center" justify="center" gap="$3" p="$5">
        <YStack
          width={64}
          height={64}
          items="center"
          justify="center"
          bg="$color4"
          rounded={18}
        >
          <Icon size={32} color="$color10" />
        </YStack>
        <SizableText
          size="$4"
          fontWeight="600"
          color="$color12"
          text="center"
          numberOfLines={2}
        >
          {title}
        </SizableText>
      </YStack>
    </GlassView>
  )
}
