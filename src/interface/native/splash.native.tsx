import MaskedView from '@react-native-masked-view/masked-view'
import * as SplashScreen from 'expo-splash-screen'
import type { ReactNode } from 'react'
import { Fragment, useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import { View } from 'tamagui'

// prevent auto-hiding the splash screen
SplashScreen.preventAutoHideAsync()

const manifest = {
  background: '#ecd20d',
  logo: {
    width: 80,
    height: 80,
  },
}

const MAX_SCALE = 15

type SplashProps = {
  children: ReactNode
  startAnimation?: boolean
}

export function Splash({ children, startAnimation = true }: SplashProps) {
  const [ready, setReady] = useState<boolean>(false)
  const [splashHidden, setSplashHidden] = useState<boolean>(false)
  const opacity = useSharedValue(1)
  const rotate = useSharedValue(0)
  const scale = useSharedValue(1)

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: rotate.value + 'deg' }],
  }))

  // hide the native splash screen once our custom animation is ready
  useEffect(() => {
    if (ready && startAnimation && !splashHidden) {
      // start the animation
      rotate.value = withTiming(360, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      })

      // third: Start fading and scaling after rotation completes
      opacity.value = withDelay(350, withTiming(0, { duration: 250 }))

      // finally: Scale up the mask to reveal content
      scale.value = withDelay(
        500,
        withTiming(
          MAX_SCALE,
          {
            duration: 350,
            easing: Easing.back(0.75),
          },
          () => {
            runOnJS(setSplashHidden)(true)
          }
        )
      )

      // hide the native splash screen immediately as we start our custom animation
      SplashScreen.hideAsync()
    }
  }, [ready, startAnimation, splashHidden, opacity, rotate, scale])

  return (
    <Fragment>
      {/* Apply background color under the mask */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: manifest.background }]} />

      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          // transparent background because mask is based off alpha channel
          <View style={[StyleSheet.absoluteFill, styles.transparent]}>
            <View style={styles.centerContent}>
              <Animated.View
                style={[styles.mask, scaleStyle]}
                onLayout={() => {
                  setReady(true)
                }}
              />
            </View>
          </View>
        }
      >
        {children}
      </MaskedView>

      {/* Don't apply background color above the mask */}
      {!splashHidden && (
        <View style={[StyleSheet.absoluteFill, styles.transparent]}>
          <View style={styles.centerContent}>
            <Animated.Image
              source={require('../../../assets/splash/logo.png')}
              style={[styles.logo, opacityStyle, scaleStyle]}
            />
          </View>
        </View>
      )}
    </Fragment>
  )
}

const styles = StyleSheet.create({
  mask: {
    backgroundColor: 'black',
    borderRadius: manifest.logo.width,
    width: manifest.logo.width - 10,
    height: manifest.logo.height - 10,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: manifest.logo.width,
    height: manifest.logo.height,
  },
})
