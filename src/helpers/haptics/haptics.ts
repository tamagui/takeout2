import * as Haptics from 'expo-haptics'
import { isIos } from '~/constants/platform'

export const hapticImpact = (style = Haptics.ImpactFeedbackStyle.Light) => {
  if (isIos) {
    Haptics.impactAsync(style)
  }
}

export const hapticSelection = () => {
  if (isIos) {
    Haptics.selectionAsync()
  }
}

export const hapticNotification = (type = Haptics.NotificationFeedbackType.Success) => {
  if (isIos) {
    Haptics.notificationAsync(type)
  }
}

export const modalOpen = () => {
  hapticImpact(Haptics.ImpactFeedbackStyle.Light)
}

export const modalClose = () => {
  hapticSelection()
}
