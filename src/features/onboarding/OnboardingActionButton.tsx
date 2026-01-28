import { XStack, isWeb } from 'tamagui'

import { Button } from '~/interface/buttons/Button'
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
      <Button
        onPress={onPrev}
        circular
        size={isWeb ? 'medium' : 'xl'}
        bg="$color6"
        hoverStyle={{ bg: '$color7' }}
        pressStyle={{ bg: '$color4' }}
      >
        <CaretLeftIcon size={18} color="$color11" />
      </Button>
      <Button
        onPress={onNext}
        circular
        size={isWeb ? 'medium' : 'xl'}
        bg="$color10"
        hoverStyle={{ bg: '$color11' }}
        pressStyle={{ bg: '$color4' }}
      >
        <CaretRightIcon size={18} color="white" />
      </Button>
    </XStack>
  )
}
