import { LinearGradient } from '@tamagui/linear-gradient'
import { BlurView } from 'expo-blur'
import { ImageBackground, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme, useWindowDimensions, View } from 'tamagui'

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
  const theme = useTheme()
  const inset = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()

  if (useImage) {
    return (
      <ImageBackground
        source={require('../../../assets/background.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View flex={1} pb={useInsets ? inset.bottom : 0}>
          {/* Content */}
          {children}
        </View>
        <GradientBlurView tint="light" intensity={60} width={width} height={height / 2} />
      </ImageBackground>
    )
  }

  // Generated gradient background
  return (
    <View flex={1}>
      <LinearGradient
        colors={[
          theme.blue1.get(),
          theme.accent2.get(),
          theme.green1.get(),
          theme.yellow1.get(),
        ]}
        locations={[0, 0.3, 0.6, 1]}
        start={[0, 0]}
        end={[1, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle overlay gradient */}
      <LinearGradient
        colors={[theme.background.get() + '40', 'transparent', theme.color2.get() + '30']}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      {children}
    </View>
  )
}
