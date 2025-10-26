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

// Modal-specific haptics
export const modalOpen = () => {
  hapticImpact(Haptics.ImpactFeedbackStyle.Light)
}

export const modalClose = () => {
  hapticSelection()
}

// Default export for backward compatibility
export default {
  hapticImpact,
  hapticSelection,
  hapticNotification,
  modalOpen,
  modalClose,
}
