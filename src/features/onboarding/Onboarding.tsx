import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  SizableText,
  Theme,
  XStack,
  YStack,
  type ThemeName,
} from 'tamagui'

import Glint from '~/interface/effects/Glint'

import { OnboardingActionButton } from './OnboardingActionButton'
import { GRID_ROTATIONS, LAYOUT_CONFIGS } from './onboardingConfig'
import { OnboardingPageIndicator } from './OnboardingPageIndicator'
import { onboardingSlides } from './onboardingSlides'

import type {
  OnboardingProps,
  OnboardingSlideData,
  SlideFeature,
  SlideLayout,
} from './types'
const SWIPE_THRESHOLD = 50

// circle positions for each slide - adds visual variety
const CIRCLE_POSITIONS: {
  top?: number | string
  bottom?: number | string
  left?: number | string
  right?: number | string
}[] = [
  { top: -80, right: -80 }, // slide 0: top right
  { bottom: -60, left: -60 }, // slide 1: bottom left
  { top: -60, left: -60 }, // slide 2: top left
  { bottom: -80, right: -80 }, // slide 3: bottom right
]

// web version - decorative panel for auth layout
export function Onboarding(_props?: Partial<OnboardingProps>) {
  const [slideIndex, setSlideIndex] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  const currentSlide = onboardingSlides[slideIndex]

  const goToPrev = () => {
    setDirection('prev')
    setSlideIndex((prev) => (prev > 0 ? prev - 1 : onboardingSlides.length - 1))
  }

  const goToNext = () => {
    setDirection('next')
    setSlideIndex((prev) => (prev < onboardingSlides.length - 1 ? prev + 1 : 0))
  }

  return (
    <Theme name={(currentSlide?.theme ?? 'blue') as ThemeName}>
      <YStack
        flex={1}
        bg="$color3"
        p="$4"
        m="$3"
        rounded={24}
        display="none"
        $md={{ display: 'flex' }}
        position="relative"
        overflow="hidden"
      >
        <OnboardingContent
          slide={currentSlide}
          slideIndex={slideIndex}
          totalSlides={onboardingSlides.length}
          direction={direction}
          onPrev={goToPrev}
          onNext={goToNext}
        />
      </YStack>
    </Theme>
  )
}

function OnboardingContent({
  slide,
  slideIndex,
  totalSlides,
  direction,
  onPrev,
  onNext,
}: {
  slide: OnboardingSlideData | undefined
  slideIndex: number
  totalSlides: number
  direction: 'next' | 'prev'
  onPrev: () => void
  onNext: () => void
}) {
  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handlePointerDown = (e: PointerEvent) => {
      touchStartX.current = e.clientX
    }

    const handlePointerUp = (e: PointerEvent) => {
      if (touchStartX.current === null) return

      const diff = e.clientX - touchStartX.current

      if (diff > SWIPE_THRESHOLD) {
        onPrev()
      } else if (diff < -SWIPE_THRESHOLD) {
        onNext()
      }

      touchStartX.current = null
    }

    el.addEventListener('pointerdown', handlePointerDown)
    el.addEventListener('pointerup', handlePointerUp)

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown)
      el.removeEventListener('pointerup', handlePointerUp)
    }
  }, [onPrev, onNext])

  if (!slide) return null

  return (
    <YStack
      ref={containerRef as any}
      flex={1}
      justify="space-between"
      cursor="pointer"
      style={{ userSelect: 'none' }}
    >
      {/* background circle with highlight - position varies per slide, fades in */}
      <AnimatePresence>
        <YStack
          key={slideIndex}
          position="absolute"
          z={0}
          transition="medium"
          opacity={1}
          scale={1}
          enterStyle={{ opacity: 0, scale: 0.8 }}
          exitStyle={{ opacity: 0, scale: 0.8 }}
          {...CIRCLE_POSITIONS[slideIndex % CIRCLE_POSITIONS.length]}
        >
          <YStack width={200} height={200} bg="$color4" rounded={100} overflow="hidden">
            <Glint rounded={100} />
          </YStack>
        </YStack>
      </AnimatePresence>

      {/* slide content - direction determines animation */}
      <YStack flex={1} position="relative">
        <AnimatePresence>
          <YStack
            key={slide.id}
            fullscreen
            justify="center"
            gap="$4"
            z={1}
            transition="medium"
            x={0}
            enterStyle={{ opacity: 0, x: direction === 'next' ? 20 : -20 }}
            exitStyle={{ opacity: 0, x: direction === 'next' ? -20 : 20 }}
          >
            <YStack gap="$2">
              <SizableText
                size="$8"
                fontWeight="800"
                color="$color12"
                fontFamily="$heading"
                lineHeight="$8"
              >
                {slide.title}
              </SizableText>
              <SizableText size="$3" color="$color11">
                {slide.description}
              </SizableText>
            </YStack>

            <YStack items="center" pt="$4">
              <FeatureLayout
                layout={slide.layout}
                features={slide.features}
                cardWidth={280}
              />
            </YStack>
          </YStack>
        </AnimatePresence>
      </YStack>

      {/* controls */}
      <XStack justify="space-between" items="center" pt="$3" z={2}>
        <OnboardingPageIndicator totalPages={totalSlides} currentPage={slideIndex} />
        <OnboardingActionButton onPrev={onPrev} onNext={onNext} />
      </XStack>
    </YStack>
  )
}

function FeatureLayout({
  layout,
  features,
  cardWidth,
}: {
  layout: SlideLayout
  features: SlideFeature[]
  cardWidth: number
}) {
  if (layout === 'grid') {
    return <GridLayout features={features} cardWidth={cardWidth} />
  }

  const config = LAYOUT_CONFIGS[layout]
  const itemWidth = cardWidth * config.cardWidthRatio

  return (
    <YStack width={cardWidth} height={config.containerHeight} position="relative">
      {features.map((feature, i) => {
        const pos = config.positions[i]
        if (!pos) return null

        const isStack = layout === 'stack'
        const positionStyle: Record<string, number | string> = {
          position: 'absolute',
          top: pos.t,
        }

        if (isStack) {
          positionStyle.left = (cardWidth - itemWidth) / 2
        } else if (pos.l !== undefined) {
          positionStyle.left = pos.l
        } else if (pos.r !== undefined) {
          positionStyle.right = pos.r
        }

        return (
          <YStack
            key={i}
            {...positionStyle}
            z={features.length - i}
            rotate={pos.rotate !== '0deg' ? pos.rotate : undefined}
            transition="medium"
            opacity={1}
            scale={1}
            y={0}
            enterStyle={{ opacity: 0, scale: 0.9, y: 10 }}
          >
            <FeatureCard feature={feature} width={itemWidth} height={config.cardHeight} />
          </YStack>
        )
      })}
    </YStack>
  )
}

function GridLayout({
  features,
  cardWidth,
}: {
  features: SlideFeature[]
  cardWidth: number
}) {
  const gridItemSize = (cardWidth - 16) / 2

  return (
    <YStack gap="$3" width={cardWidth} height={300} justify="center">
      <XStack gap="$3" justify="center">
        <YStack
          rotate={GRID_ROTATIONS[0]}
          transition="medium"
          opacity={1}
          scale={1}
          enterStyle={{ opacity: 0, scale: 0.9 }}
        >
          <FeatureCardSquare feature={features[0]} size={gridItemSize} />
        </YStack>
        <YStack
          rotate={GRID_ROTATIONS[1]}
          transition="medium"
          opacity={1}
          scale={1}
          enterStyle={{ opacity: 0, scale: 0.9 }}
        >
          <FeatureCardSquare feature={features[1]} size={gridItemSize} />
        </YStack>
      </XStack>
      <XStack gap="$3" justify="center">
        <YStack
          rotate={GRID_ROTATIONS[2]}
          transition="medium"
          opacity={1}
          scale={1}
          enterStyle={{ opacity: 0, scale: 0.9 }}
        >
          <FeatureCardSquare feature={features[2]} size={gridItemSize} />
        </YStack>
        <YStack
          rotate={GRID_ROTATIONS[3]}
          transition="medium"
          opacity={1}
          scale={1}
          enterStyle={{ opacity: 0, scale: 0.9 }}
        >
          <FeatureCardSquare feature={features[3]} size={gridItemSize} />
        </YStack>
      </XStack>
    </YStack>
  )
}

function FeatureCard({
  feature,
  width,
  height,
}: {
  feature: SlideFeature
  width: number
  height: number
}) {
  const { Icon, title } = feature

  return (
    <XStack
      width={width}
      height={height}
      bg="$color2"
      rounded={18}
      px="$4"
      gap="$3"
      items="center"
      position="relative"
      overflow="hidden"
    >
      <Glint rounded={18} />
      <YStack
        width={36}
        height={36}
        items="center"
        justify="center"
        bg="$color4"
        rounded={10}
      >
        <Icon size={20} color="$color10" />
      </YStack>
      <SizableText size="$3" fontWeight="600" color="$color12">
        {title}
      </SizableText>
    </XStack>
  )
}

function FeatureCardSquare({
  feature,
  size,
}: {
  feature: SlideFeature | undefined
  size: number
}) {
  if (!feature) return null
  const { Icon, title } = feature

  return (
    <YStack
      width={size}
      height={size}
      bg="$color2"
      rounded={18}
      items="center"
      justify="center"
      gap="$2"
      p="$3"
      position="relative"
      overflow="hidden"
    >
      <Glint rounded={18} />
      <YStack
        width={44}
        height={44}
        items="center"
        justify="center"
        bg="$color5"
        rounded={12}
      >
        <Icon size={24} color="$color11" />
      </YStack>
      <SizableText
        size="$2"
        fontWeight="600"
        color="$color12"
        text="center"
        numberOfLines={2}
      >
        {title}
      </SizableText>
    </YStack>
  )
}
