import { isNative } from '@take-out/helpers'
import * as ExpoHaptics from 'expo-haptics'

export type HapticStyle = boolean | 'light' | 'medium' | 'heavy' | 'soft' | 'rigid'

// only enable haptics on iOS and Android
const isHapticsSupported = isNative

/**
 * Light impact feedback - subtle haptic
 */
export const lightImpact = async (): Promise<void> => {
  if (!isHapticsSupported) return
  await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light)
}

/**
 * Medium impact feedback - moderate haptic
 */
export const mediumImpact = async (): Promise<void> => {
  if (!isHapticsSupported) return
  await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium)
}

/**
 * Heavy impact feedback - strong haptic
 */
export const heavyImpact = async (): Promise<void> => {
  if (!isHapticsSupported) return
  await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy)
}

/**
 * Soft impact feedback - very subtle haptic (iOS 13+)
 */
export const softImpact = async (): Promise<void> => {
  if (!isHapticsSupported) return
  await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Soft)
}

/**
 * Rigid impact feedback - sharp haptic (iOS 13+)
 */
export const rigidImpact = async (): Promise<void> => {
  if (!isHapticsSupported) return
  await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid)
}

/**
 * Selection feedback - used for selection changes
 */
export const selectionFeedback = async (): Promise<void> => {
  if (!isHapticsSupported) return
  await ExpoHaptics.selectionAsync()
}

/**
 * Success notification feedback
 */
export const successNotification = async (): Promise<void> => {
  if (!isHapticsSupported) return
  await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success)
}

/**
 * Warning notification feedback
 */
export const warningNotification = async (): Promise<void> => {
  if (!isHapticsSupported) return
  await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning)
}

/**
 * Error notification feedback
 */
export const errorNotification = async (): Promise<void> => {
  if (!isHapticsSupported) return
  await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error)
}

/**
 * Generic impact with custom style
 */
export const impact = async (style: ExpoHaptics.ImpactFeedbackStyle): Promise<void> => {
  if (!isHapticsSupported) return
  await ExpoHaptics.impactAsync(style)
}

/**
 * Generic notification with custom type
 */
export const notification = async (
  type: ExpoHaptics.NotificationFeedbackType
): Promise<void> => {
  if (!isHapticsSupported) return
  await ExpoHaptics.notificationAsync(type)
}

// export the types for convenience
export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType

// preset haptic patterns for common interactions
export const haptics = {
  // button interactions
  buttonPress: lightImpact,
  buttonLongPress: mediumImpact,

  // navigation
  tabSwitch: selectionFeedback,
  pageTransition: lightImpact,
  pullToRefresh: mediumImpact,

  // gestures
  swipeAction: lightImpact,
  pinchZoom: selectionFeedback,
  dragStart: lightImpact,
  dragEnd: lightImpact,
  snapToPosition: rigidImpact,

  // feedback
  success: successNotification,
  warning: warningNotification,
  error: errorNotification,

  // toggles and selections
  toggleOn: mediumImpact,
  toggleOff: lightImpact,
  selectionChange: selectionFeedback,

  // alerts and modals
  modalOpen: mediumImpact,
  modalClose: lightImpact,
  alertShow: warningNotification,

  // messages and notifications
  messageSent: lightImpact,
  messageReceived: mediumImpact,
  notificationReceived: mediumImpact,
}

// default export for convenience
export default haptics
