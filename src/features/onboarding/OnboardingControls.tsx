import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'
import { XStack } from 'tamagui'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'

export type OnboardingControlsProps = {
  currentIdx: number
  onChange: (newIdx: number) => void
  stepsCount: number
  /**
   * native only
   */
  onFinish?: () => void
}

export const OnboardingControls = ({
  currentIdx,
  onChange,
  stepsCount,
}: OnboardingControlsProps) => {
  const handleGoNext = () => {
    if (currentIdx + 1 > stepsCount - 1) {
      // onChange(0)
      return
    }
    onChange(currentIdx + 1)
  }

  const handleGoPrev = () => {
    if (currentIdx - 1 < 0) {
      // onChange(stepsCount - 1)
      return
    }
    onChange(currentIdx - 1)
  }

  return (
    <>
      <XStack
        justify="space-between"
        items="center"
        p="$5"
        gap="$5"
        position="absolute"
        b={0}
        l={0}
        r={0}
        $maxSM={{ display: 'none' }}
      >
        <ButtonSimple
          size="large"
          circular
          onPress={() => handleGoPrev()}
          icon={ChevronLeft}
        />

        <ButtonSimple
          size="large"
          circular
          onPress={() => handleGoNext()}
          icon={ChevronRight}
        />
      </XStack>
    </>
  )
}
