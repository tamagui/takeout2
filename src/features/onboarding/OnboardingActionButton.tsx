import { memo, useState } from 'react'
import { runOnJS, useAnimatedReaction, type SharedValue } from 'react-native-reanimated'
import { SizableText, Stack, XStack, YStack, styled } from 'tamagui'

import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'

interface OnboardingActionButtonProps {
  currentPage: SharedValue<number>
  totalPages: number
  onPress: () => void
  onSkip?: () => void
}

const ActionButton = styled(Stack, {
  height: 56,
  items: 'center',
  justify: 'center',
  bg: '$color9',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  pressStyle: {
    scale: 0.97,
    opacity: 0.9,
  },

  variants: {
    isExpanded: {
      true: {
        width: 200,
        borderRadius: 16,
        bg: '$color10',
      },
      false: {
        width: 56,
        borderRadius: 28,
      },
    },
  } as const,

  defaultVariants: {
    isExpanded: false,
  },
})

const AnimatedContent = styled(YStack, {
  position: 'absolute',
  transition: 'quick',

  variants: {
    visible: {
      true: {
        opacity: 1,
        scale: 1,
        y: 0,
      },
      false: {
        opacity: 0,
        scale: 0.5,
        y: 10,
      },
    },
  } as const,
})

const SkipButton = styled(Stack, {
  transition: 'quick',

  variants: {
    visible: {
      true: {
        opacity: 1,
        pointerEvents: 'auto',
      },
      false: {
        opacity: 0,
        pointerEvents: 'none',
      },
    },
  } as const,
})

export const OnboardingActionButton = memo(function OnboardingActionButton({
  currentPage,
  totalPages,
  onPress,
  onSkip,
}: OnboardingActionButtonProps) {
  const [isLastPage, setIsLastPage] = useState(false)

  useAnimatedReaction(
    () => currentPage.value === totalPages - 1,
    (isLast) => {
      runOnJS(setIsLastPage)(isLast)
    },
    [totalPages]
  )

  return (
    <XStack justify="space-between" items="center" width="100%">
      <SkipButton visible={!isLastPage} onPress={onSkip} hitSlop={12} cursor="pointer">
        <SizableText color="$color10" size="$4" fontWeight="500">
          Skip
        </SizableText>
      </SkipButton>

      <ActionButton
        isExpanded={isLastPage}
        transition="medium"
        onPress={onPress}
        cursor="pointer"
      >
        <AnimatedContent visible={!isLastPage}>
          <CaretRightIcon size={28} color="white" />
        </AnimatedContent>
        <AnimatedContent visible={isLastPage}>
          <SizableText color="$color6" size="$5" fontWeight="600">
            Get Started
          </SizableText>
        </AnimatedContent>
      </ActionButton>
    </XStack>
  )
})
