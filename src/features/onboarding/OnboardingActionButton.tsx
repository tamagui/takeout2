import { XStack, isWeb } from 'tamagui'

import { Button } from '~/interface/buttons/Button'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'

import type { OnboardingActionButtonProps } from './types'

export function OnboardingActionButton({ onPrev, onNext }: OnboardingActionButtonProps) {
  return (
    <XStack
      gap="2"
      justify="native:space-between"
      items="native:center"
      width="native:100%"
    >
      <Button
        onPress={onPrev}
        circular
        size={isWeb ? 'medium' : 'xl'}
        bg="color6 hover:color7 press:color4"
      >
        <CaretLeftIcon size={18} color="$color11" />
      </Button>
      <Button
        onPress={onNext}
        circular
        size={isWeb ? 'medium' : 'xl'}
        bg="color10 hover:color11 press:color4"
      >
        <CaretRightIcon size={18} color="white" />
      </Button>
    </XStack>
  )
}
