import { One } from 'one'
import { StyleSheet, useColorScheme, View } from 'react-native'
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg'

// the control floats over whatever the app happens to be painting, which can be
// a photo, a dense list, or another piece of chrome. a hard-edged blur panel
// reads as a second app bar; a feathered one reads as the screen softening
// underneath the control.
//
// the mask is a radial gradient that holds opaque through the middle and eases
// to clear well before the region's edge, so the blur has no visible boundary
// at all. the gradient drives mask alpha, so the same stops serve light and
// dark mode and only the material tint below has to follow the scheme.
const STOPS = [
  { offset: '0%', opacity: 1 },
  { offset: '45%', opacity: 1 },
  { offset: '62%', opacity: 0.82 },
  { offset: '76%', opacity: 0.5 },
  { offset: '88%', opacity: 0.2 },
  { offset: '100%', opacity: 0 },
]

export function FeedbackHalo({ width, height }: { width: number; height: number }) {
  const dark = useColorScheme() === 'dark'
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', width, height, left: 0, top: 0 }}
    >
      <One.UI.Mask
        style={StyleSheet.absoluteFill}
        maskElement={
          <Svg width={width} height={height}>
            <Defs>
              <RadialGradient id="feedbackHalo" cx="50%" cy="50%" rx="50%" ry="50%">
                {STOPS.map((stop) => (
                  <Stop
                    key={stop.offset}
                    offset={stop.offset}
                    stopColor="#fff"
                    stopOpacity={stop.opacity}
                  />
                ))}
              </RadialGradient>
            </Defs>
            <Ellipse
              cx={width / 2}
              cy={height / 2}
              rx={width / 2}
              ry={height / 2}
              fill="url(#feedbackHalo)"
            />
          </Svg>
        }
      >
        <One.UI.Blur
          intensity={28}
          tint={dark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: dark ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.28)' },
          ]}
        />
      </One.UI.Mask>
    </View>
  )
}
