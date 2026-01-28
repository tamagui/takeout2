import { LinearGradient } from '@tamagui/linear-gradient'
import { ImageBackground, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWindowDimensions, View } from 'tamagui'

import { useIsDark } from '~/features/theme/useIsDark'

import { GradientBlurView } from '../effects/GradientBlurView'

interface GradientBackgroundProps {
  useImage?: boolean
  useInsets?: boolean
  bottomOffset?: number
  children?: React.ReactNode
}

export const GradientBackground = ({
  useImage = false,
  useInsets = true,
  children,
  bottomOffset,
}: GradientBackgroundProps) => {
  const inset = useSafeAreaInsets()
  const isDark = useIsDark()
  const { width, height } = useWindowDimensions()
  const offset = bottomOffset || inset.top + 60

  const lightColors = ['$color1', '$color2', '$color4', '$color5']
  const darkColors = ['$color1', '$color3', '$color2', '$color1']

  if (useImage) {
    return (
      <>
        <View
          flex={1}
          pb={useInsets ? inset.bottom : 0}
          $platform-android={{
            // TODO: check this on One Stack Header
            pt: offset,
          }}
        >
          {/* Content */}
          {children}
        </View>
        <ImageBackground
          source={
            isDark
              ? require('../../../assets/background-dark.png')
              : require('../../../assets/background-light.png')
          }
          style={[StyleSheet.absoluteFillObject, { zIndex: -2 }]}
          resizeMode="cover"
        />
        <GradientBlurView width={width} height={height / 1.5} />
      </>
    )
  }

  return (
    <View
      flex={1}
      pb={useInsets ? inset.bottom : 0}
      $platform-android={{
        // TODO: check this on One Stack Header
        pt: offset,
      }}
    >
      {/* Base gradient - using theme colors */}
      <LinearGradient
        colors={isDark ? darkColors : lightColors}
        locations={[0, 0.3, 0.6, 1]}
        start={[0, 0]}
        end={[1, 1]}
        style={[StyleSheet.absoluteFill, { zIndex: -2 }]}
      />

      {/* Content */}
      {children}
    </View>
  )
}
