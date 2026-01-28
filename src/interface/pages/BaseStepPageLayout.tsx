import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EnsureFlexed, isWeb, YStack } from 'tamagui'

import { GradientBackground } from '../backgrounds/GradientBackground'

import type { ReactNode } from 'react'

export const BaseStepPageLayout = ({
  children,
  bottom: bottomElement,
  disableScroll = true,
  disableKeyboardAvoidingView = false,
  hideBackButton = false,
  keyboardOffset = 0,
}: {
  children: ReactNode
  bottom?: ReactNode
  disableScroll?: boolean
  disableKeyboardAvoidingView?: boolean
  hideBackButton?: boolean
  keyboardOffset?: number
}) => {
  const { top, bottom } = useSafeAreaInsets()

  const content = (
    <>
      {isWeb ? (
        <YStack flex={1} p="$5">
          <YStack width="100%" maxW={400}>
            {children}
            {bottomElement && bottomElement}
          </YStack>
        </YStack>
      ) : (
        <GradientBackground>
          <ScrollView
            scrollEnabled={!disableScroll}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            <YStack minW="100%" flex={1} pt={!hideBackButton ? top + 24 : 0} rounded="$6">
              <YStack maxW={600} self="center" px={14}>
                <EnsureFlexed />
                {children}
              </YStack>
            </YStack>
          </ScrollView>
        </GradientBackground>
      )}

      {!isWeb && bottomElement && (
        <YStack position="absolute" b={0} l={0} r={0} px="$4" z={999}>
          {bottomElement}
        </YStack>
      )}
    </>
  )

  // Disable KeyboardAvoidingView if explicitly disabled OR if using sticky footer
  // (KeyboardStickyView handles keyboard better than KeyboardAvoidingView)
  if (disableKeyboardAvoidingView || bottomElement) {
    return <YStack flex={1}>{content}</YStack>
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={
        keyboardOffset !== 0 ? keyboardOffset : bottom > 30 ? -24 : 0
      }
      style={{ flex: 1 }}
    >
      {content}
    </KeyboardAvoidingView>
  )
}
