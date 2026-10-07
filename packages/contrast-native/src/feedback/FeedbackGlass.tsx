import { One } from 'one'
import { Platform, StyleSheet, useColorScheme, View } from 'react-native'
import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

export function FeedbackGlass({
  children,
  style,
  radius = 0,
}: {
  children?: ReactNode
  style?: StyleProp<ViewStyle>
  radius?: number
}) {
  const dark = useColorScheme() === 'dark'

  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
      {Platform.OS === 'ios' ? (
        <One.iOS.Glass
          children={null}
          glassEffect="regular"
          material="regular"
          shape="roundedRectangle"
          cornerRadius={radius}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <>
          <One.UI.Blur
            intensity={40}
            tint={dark ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: dark ? 'rgba(40,40,46,0.55)' : 'rgba(255,255,255,0.6)' },
            ]}
          />
        </>
      )}
      {/* the absolute material layers paint above static-flow siblings, so the
          foreground needs its own positioned layer to stay on top of them */}
      <View style={{ position: 'relative', zIndex: 1, flex: 1 }}>{children}</View>
    </View>
  )
}
