import { LinearGradient } from '@tamagui/linear-gradient'
import { BlurView } from 'expo-blur'
import { ImageBackground, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWindowDimensions, View } from 'tamagui'

import { useIsDark } from '~/features/theme/useIsDark'

import { GradientBlurView } from '../effects/GradientBlurView'

interface GradientBackgroundProps {
  useImage?: boolean
  useInsets?: boolean
  children?: React.ReactNode
}

export const GradientBackground = ({
  useImage = false,
  useInsets = true,
  children,
}: GradientBackgroundProps) => {
  const inset = useSafeAreaInsets()
  const isDark = useIsDark()
  const { width, height } = useWindowDimensions()

  if (useImage) {
    return (
      <>
        <View flex={1} pb={useInsets ? inset.bottom : 0}>
          {/* Content */}
          {children}
        </View>
        <ImageBackground
          source={require('../../../assets/background.png')}
          style={[StyleSheet.absoluteFillObject, { zIndex: -2 }]}
          resizeMode="cover"
        />
        <GradientBlurView
          tint={isDark ? 'dark' : 'light'}
          width={width}
          height={height / 1.5}
        />
      </>
    )
  }

  // Generated gradient background - dark purple/blue theme
  return (
    <View flex={1} pb={useInsets ? inset.bottom : 0}>
      {/* Base gradient - deep navy to dark purple */}
      <LinearGradient
        colors={['#1a1a3e', '#252555', '#2d2a5a', '#1e1e45']}
        locations={[0, 0.3, 0.6, 1]}
        start={[0, 0]}
        end={[1, 1]}
        style={[StyleSheet.absoluteFill, { zIndex: -2 }]}
      />

      {/* Accent gradient overlay - purple/pink highlights */}
      <LinearGradient
        colors={['transparent', 'rgba(90, 70, 180, 0.3)', 'rgba(160, 100, 180, 0.2)']}
        locations={[0, 0.5, 1]}
        start={[0, 0]}
        end={[1, 1]}
        style={[StyleSheet.absoluteFill, { zIndex: -2 }]}
      />

      {/* Content */}
      {children}
      <GradientBlurView
        tint={isDark ? 'dark' : 'light'}
        width={width}
        height={height / 1.5}
      />
    </View>
  )
}
