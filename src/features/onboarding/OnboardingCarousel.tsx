import {
  ChevronLeft,
  ChevronRight,
  Rocket,
  Sparkles,
  TrendingUp,
} from '@tamagui/lucide-icons'
import { useEffect, useState } from 'react'
import {
  AnimatePresence,
  Button,
  Circle,
  H3,
  SizableText,
  Theme,
  XStack,
  YStack,
  styled,
} from 'tamagui'

const CarouselContainer = styled(YStack, {
  width: '100%',
  maxW: 500,
  mx: 'auto',
  position: 'relative',
  overflow: 'hidden',
  rounded: '$8',
  borderWidth: 1,
  borderColor: '$color3',
  bg: '$color1',
  shadowColor: '$shadowColor',
  shadowOpacity: 0.05,
  shadowRadius: 10,
})

const CarouselContent = styled(YStack, {
  p: '$6',
  items: 'center',
  justify: 'center',
  height: 400,
  position: 'relative',
})

const DotIndicator = styled(Circle, {
  size: 8,
  bg: '$color6',

  variants: {
    active: {
      true: {
        bg: '$color10',
        scale: 1.2,
      },
    },
  } as const,
})

const NavigationButton = styled(Button, {
  position: 'absolute',
  t: '50%',
  transform: 'translateY(-50%)',
  size: '$3',
  circular: true,
  bg: '$color2',
  borderWidth: 1,
  borderColor: '$color3',
  z: 10,

  variants: {
    side: {
      left: {
        l: '$2',
      },
      right: {
        r: '$2',
      },
    },
  } as const,
})

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  theme: 'orange' | 'green' | 'blue'
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'kickstart',
    title: 'Lightning Fast Development',
    description:
      'Build full-stack apps with the power of Tamagui, React Native, and modern web technologies',
    icon: Sparkles,
    theme: 'orange',
  },
  {
    id: 'updates',
    title: 'Real-time Updates',
    description:
      'Live collaboration with instant updates powered by Zero sync and optimistic UI',
    icon: TrendingUp,
    theme: 'green',
  },
  {
    id: 'deploy',
    title: 'Deploy Anywhere',
    description:
      'Ship to web, iOS, and Android from a single codebase with production-ready tooling',
    icon: Rocket,
    theme: 'blue',
  },
]

interface OnboardingCarouselProps {
  onComplete?: () => void
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function OnboardingCarousel({
  onComplete,
  autoPlay = true,
  autoPlayInterval = 4000,
}: OnboardingCarouselProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(false)

  const goToStep = (index: number) => {
    setHasInteracted(true)
    setCurrentStep(index)
  }

  const goNext = () => {
    setHasInteracted(true)
    if (currentStep === onboardingSteps.length - 1) {
      onComplete?.()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const goPrev = () => {
    setHasInteracted(true)
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  // auto-play effect
  useEffect(() => {
    if (!autoPlay || hasInteracted) return

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev === onboardingSteps.length - 1) {
          return 0 // loop back to start
        }
        return prev + 1
      })
    }, autoPlayInterval)

    return () => clearInterval(timer)
  }, [autoPlay, autoPlayInterval, hasInteracted])

  const step = onboardingSteps[currentStep]
  if (!step) return null
  const Icon = step.icon

  return (
    <CarouselContainer>
      <Theme name={step.theme}>
        <CarouselContent>
          <AnimatePresence>
            <YStack
              key={step.id}
              animation="medium"
              enterStyle={{
                opacity: 0,
                scale: 0.9,
                y: 10,
              }}
              exitStyle={{
                opacity: 0,
                scale: 0.9,
                y: -10,
              }}
              items="center"
              gap="$4"
              width="100%"
            >
              <Circle
                size={80}
                bg="$color3"
                animation="bouncy"
                enterStyle={{ scale: 0.5, opacity: 0 }}
                shadowColor="$color12"
                shadowOpacity={0.1}
                shadowRadius={20}
                borderWidth={1}
                borderColor="$color4"
                items="center"
                justify="center"
              >
                <Icon size={40} color="$color10" />
              </Circle>

              <YStack items="center" gap="$2" maxW={400}>
                <H3
                  text="center"
                  color="$color12"
                  animation="200ms"
                  enterStyle={{ opacity: 0, y: -10 }}
                >
                  {step.title}
                </H3>
                <SizableText
                  text="center"
                  color="$color11"
                  size="$4"
                  animation="200ms"
                  enterStyle={{ opacity: 0 }}
                  lineHeight="$4"
                >
                  {step.description}
                </SizableText>
              </YStack>
            </YStack>
          </AnimatePresence>

          {/* navigation buttons */}
          <NavigationButton
            side="left"
            onPress={goPrev}
            disabled={currentStep === 0}
            opacity={currentStep === 0 ? 0.3 : 1}
            icon={ChevronLeft}
            circular
            pressStyle={{
              scale: 0.95,
            }}
            hoverStyle={{
              bg: '$color3',
            }}
          />

          <NavigationButton
            side="right"
            onPress={goNext}
            icon={ChevronRight}
            circular
            pressStyle={{
              scale: 0.95,
            }}
            hoverStyle={{
              bg: '$color3',
            }}
          />
        </CarouselContent>
      </Theme>

      {/* dot indicators */}
      <XStack position="absolute" b="$4" l={0} r={0} justify="center" gap="$2" z={10}>
        {onboardingSteps.map((_, index) => (
          <DotIndicator
            key={index}
            active={index === currentStep}
            animation="quick"
            pressStyle={{ scale: 0.9 }}
            onPress={() => goToStep(index)}
            cursor="pointer"
          />
        ))}
      </XStack>

      {/* skip button */}
      {currentStep < onboardingSteps.length - 1 && (
        <Button
          position="absolute"
          t="$3"
          r="$3"
          size="$2"
          variant="outlined"
          onPress={onComplete}
          color="$color10"
          pressStyle={{
            opacity: 0.7,
          }}
          hoverStyle={{
            bg: '$color2',
          }}
        >
          Skip
        </Button>
      )}

      {/* get started button on last slide */}
      {currentStep === onboardingSteps.length - 1 && (
        <YStack position="absolute" b={60} l={0} r={0} items="center" px="$4">
          <Button
            size="$4"
            theme="accent"
            onPress={onComplete}
            width="100%"
            maxW={200}
            animation="quick"
            enterStyle={{ opacity: 0, y: 10 }}
            pressStyle={{
              scale: 0.97,
            }}
          >
            Get Started
          </Button>
        </YStack>
      )}
    </CarouselContainer>
  )
}
