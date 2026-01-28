import { XStack, isWeb } from 'tamagui'

import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'

import type { OnboardingActionButtonProps } from './types'

export function OnboardingActionButton({ onPrev, onNext }: OnboardingActionButtonProps) {
  return (
    <XStack
      gap="$2"
      $platform-native={{
        justify: 'space-between',
        items: 'center',
        width: '100%',
      }}
    >
      <ButtonSimple
        onPress={onPrev}
        circular
        size={isWeb ? 'medium' : 'xl'}
        bg="$color6"
        hoverStyle={{ bg: '$color7' }}
        pressStyle={{ bg: '$color4' }}
      >
        <CaretLeftIcon size={18} color="$color11" />
      </ButtonSimple>
      <ButtonSimple
        onPress={onNext}
        circular
        size={isWeb ? 'medium' : 'xl'}
        bg="$color10"
        hoverStyle={{ bg: '$color11' }}
        pressStyle={{ bg: '$color4' }}
      >
        <CaretRightIcon size={18} color="white" />
      </ButtonSimple>
    </XStack>
  )
}
