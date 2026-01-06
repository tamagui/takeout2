import { LinearGradient } from '@tamagui/linear-gradient'
import { useUserScheme } from '@vxrn/color-scheme'
import { ImageBackground, StyleSheet, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme, useWindowDimensions, View } from 'tamagui'
import { useThemeName } from 'tamagui'

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
  const theme = useTheme()
  const { width, height } = useWindowDimensions()
  const themeName = useThemeName()
  const userScheme = useUserScheme()
  const colorScheme = useColorScheme()

  if (useImage) {
    return (
      <>
        <View flex={1} pb={useInsets ? inset.bottom : 0}>
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
        <GradientBlurView
          tint={isDark ? 'dark' : 'light'}
          width={width}
          height={height / 1.5}
        />
      </>
    )
  }

  // Generated gradient background - dark grey to black using theme colors
  const color1 = theme.color1.val
  const color2 = theme.color2.val
  const color3 = theme.color3.val

  return (
    <View flex={1} pb={useInsets ? inset.bottom : 0}>
      {/* Base gradient - using theme colors */}
      <LinearGradient
        colors={[color1, color2, color3, color1]}
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
