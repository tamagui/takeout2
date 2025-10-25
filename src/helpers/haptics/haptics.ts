import * as Haptics from 'expo-haptics'
import { isIOS } from '~/constants/platform'

export const hapticImpact = (style = Haptics.ImpactFeedbackStyle.Light) => {
  if (isIOS) {
    Haptics.impactAsync(style)
  }
}

export const hapticSelection = () => {
  if (isIOS) {
    Haptics.selectionAsync()
  }
}

export const hapticNotification = (type = Haptics.NotificationFeedbackType.Success) => {
  if (isIOS) {
    Haptics.notificationAsync(type)
  }
}
