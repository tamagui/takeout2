import { memo } from 'react'
import { LinearGradient } from '@tamagui/linear-gradient'
import { View, styled } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ProgressBarContainer = styled(View, {
  height: 8,
  width: '100%',
  bg: '$color2',
})

const ProgressBarFill = styled(View, {
  height: '100%',
  rounded: 100,
  animation: 'medium',
})

export interface ProgressBarProps {
  totalSteps: number
  currentStep: number
}

export const ProgressBar = memo(function ProgressBar({
  totalSteps,
  currentStep,
}: ProgressBarProps) {
  const { top } = useSafeAreaInsets()
  const progress = Math.min(Math.max(currentStep / totalSteps, 0), 1) * 100

  return (
    <View
      pt={top > 0 ? top : 8}
      bg="$background"
      width="100%"
      overflow="hidden"
      position="absolute"
      z={999}
    >
      <ProgressBarContainer
        animation="medium"
        opacity={1}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      >
        <ProgressBarFill width={`${progress}%`}>
          <LinearGradient
            colors={['#c06cdb', '#c498da']}
            start={[0, 0]}
            end={[1, 0]}
            style={{
              width: '100%',
              height: '100%',
              borderTopRightRadius: 100,
              borderBottomRightRadius: 100,
            }}
          />
        </ProgressBarFill>
      </ProgressBarContainer>
    </View>
  )
})
