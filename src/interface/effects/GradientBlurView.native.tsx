import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet } from 'react-native'
import { View } from 'tamagui'

import { easeGradient } from '~/helpers/gradient'
import { BlurView } from '~/interface/effects/BlurView'

import type { GradientBlurViewProps } from './GradientBlurViewProps'

export const GradientBlurView = ({
  intensity = 80,
  tint,
  inverted = false,
  ...viewProps
}: GradientBlurViewProps) => {
  const { colors, locations } = easeGradient({
    colorStops: inverted
      ? {
          0: { color: 'black' },
          0.5: { color: 'rgba(255,255,255,0.99)' },
          1: { color: 'transparent' },
        }
      : {
          0: { color: 'transparent' },
          0.5: { color: 'rgba(255,255,255,0.99)' },
          1: { color: 'black' },
        },
  })
  return (
    <View
      position="absolute"
      b={0}
      z={-1}
      overflow="hidden"
      pointerEvents="none"
      {...viewProps}
    >
      <MaskedView
        maskElement={
          <LinearGradient
            locations={locations as unknown as readonly [number, number, ...number[]]}
            colors={colors as unknown as readonly [string, string, ...string[]]}
            style={{
              position: 'absolute' as const,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        }
        style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <BlurView
          intensity={intensity}
          tint={tint}
          style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </MaskedView>
    </View>
  )
}
