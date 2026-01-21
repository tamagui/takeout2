import { XStack, useTheme, type ColorTokens } from 'tamagui'

import { Pressable } from '~/interface/buttons/Pressable'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'

import type { OnboardingActionButtonProps } from './types'

export function OnboardingActionButton({ onPrev, onNext }: OnboardingActionButtonProps) {
  const theme = useTheme()

  return (
    <XStack gap="$2">
      <Pressable
        onPress={onPrev}
        width={40}
        height={40}
        rounded={20}
        bg="$color6"
        items="center"
        justify="center"
        cursor="pointer"
        hoverStyle={{ bg: '$color7' }}
        pressStyle={{ scale: 0.95 }}
      >
        <CaretLeftIcon size={18} color={theme.color11?.val as ColorTokens} />
      </Pressable>
      <Pressable
        onPress={onNext}
        width={40}
        height={40}
        rounded={20}
        bg="$color10"
        items="center"
        justify="center"
        cursor="pointer"
        hoverStyle={{ bg: '$color11' }}
        pressStyle={{ scale: 0.95 }}
      >
        <CaretRightIcon size={18} color="white" />
      </Pressable>
    </XStack>
  )
}
