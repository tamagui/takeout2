import * as Haptics from 'expo-haptics'
import { View, type ViewProps } from 'tamagui'

import { isIos } from '~/constants/platform'

export const HapticTab = (props: ViewProps) => {
  return (
    <View
      {...props}
      onPressIn={(ev) => {
        if (isIos) {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
        props.onPressIn?.(ev)
      }}
    />
  )
}
