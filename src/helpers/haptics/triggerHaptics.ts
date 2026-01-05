import * as Haptics from 'expo-haptics'

export type HapticStyle = 'light' | 'medium' | 'rigid' | 'soft'

export const triggerHaptics = async (style: HapticStyle = 'light') => {
  const feedbackStyle =
    style === 'rigid'
      ? Haptics.ImpactFeedbackStyle.Rigid
      : style === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : style === 'soft'
          ? Haptics.ImpactFeedbackStyle.Soft
          : Haptics.ImpactFeedbackStyle.Light
  await Haptics.impactAsync(feedbackStyle)
}
