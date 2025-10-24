import MaskedView from '@react-native-masked-view/masked-view'
import type { ReactNode } from 'react'
import { Fragment, useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import BootSplash, { type Manifest } from 'react-native-bootsplash'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import { View } from 'tamagui'

const manifest: Manifest = require('../../../assets/bootsplash/manifest.json')
const MAX_SCALE = 15

type SplashProps = {
  children: ReactNode
  startAnimation?: boolean
}

export function Splash({ children, startAnimation = true }: SplashProps) {
  const [ready, setReady] = useState<boolean>(false)
  const opacity = useSharedValue(1)
  const rotate = useSharedValue(0)
  const scale = useSharedValue(1)

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: rotate.value + 'deg' }],
  }))

  // Control when to start the animation
  const shouldAnimate = ready && startAnimation

  const { container, logo /*, brand */ } = BootSplash.useHideAnimation({
    manifest,
    ready: shouldAnimate, // Use controlled animation state
    logo: require('../../../assets/bootsplash/logo.png'),

    statusBarTranslucent: true,
    navigationBarTranslucent: true,

    animate: () => {
      rotate.value = withTiming(360, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      })

      // Third: Start fading and scaling after rotation completes
      // Use withDelay instead of setTimeout for UI thread execution
      opacity.value = withDelay(350, withTiming(0, { duration: 250 }))

      // Finally: Scale up the mask to reveal content
      scale.value = withDelay(
        500,
        withTiming(MAX_SCALE, {
          duration: 350,
          easing: Easing.back(0.75),
        })
      )
    },
  })

  return (
    <Fragment>
      {/* Apply background color under the mask */}
      <View style={container.style} />

      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          // Transparent background because mask is based off alpha channel
          <View style={[container.style, styles.transparent]}>
            <Animated.View
              style={[styles.mask, scaleStyle]}
              onLayout={() => {
                setReady(true)
              }}
            />
          </View>
        }
      >
        {children}
      </MaskedView>

      {/* Don't apply background color above the mask */}
      <View {...container} style={[container.style, styles.transparent]}>
        <Animated.Image {...logo} style={[logo.style, opacityStyle, scaleStyle]} />
      </View>
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
})
