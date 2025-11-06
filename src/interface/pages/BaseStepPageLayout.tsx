import { LinearGradient } from '@tamagui/linear-gradient'
import type { ReactNode } from 'react'
import { KeyboardAvoidingView, ScrollView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isWeb, YStack } from 'tamagui'

export interface ProgressBarConfig {
  totalSteps: number
  currentStep: number
  showProgressBar?: boolean
}

export const BaseStepPageLayout = ({
  children,
  bottom: bottomElement,
  disableScroll = true,
  linearGradientFooter = false,
  progressBar,
  disableKeyboardAvoidingView = false,
  hideBackButton = false,
  keyboardOffset = 0,
}: {
  children: ReactNode
  bottom?: ReactNode
  disableScroll?: boolean
  linearGradientFooter?: boolean
  progressBar?: ProgressBarConfig
  disableKeyboardAvoidingView?: boolean
  hideBackButton?: boolean
  keyboardOffset?: number
}) => {
  const { top, bottom } = useSafeAreaInsets()

  const content = (
    <>
      {progressBar?.showProgressBar && (
        <YStack px="$4" py="$2">
          {/* Progress bar would go here */}
          <YStack height={4} bg="$color4" rounded="$2">
            <YStack
              height={4}
              bg="$color8"
              rounded="$2"
              width={`${(progressBar.currentStep / progressBar.totalSteps) * 100}%`}
            />
          </YStack>
        </YStack>
      )}

      <ScrollView
        scrollEnabled={!disableScroll}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <YStack flex={1} pt={!hideBackButton ? top + 24 : 0}>
          <YStack px={14}>
            {children}
            {isWeb ? <YStack pt="$6">{bottomElement}</YStack> : null}
          </YStack>
        </YStack>
      </ScrollView>

      {linearGradientFooter && (
        <LinearGradient
          colors={['$background0', '$background']}
          position="absolute"
          l={0}
          r={0}
          b={-40}
          height={100}
          pointerEvents="none"
        />
      )}

      {!isWeb && bottomElement && (
        <YStack
          position="absolute"
          b={0}
          l={0}
          r={0}
          pb={bottom}
          px="$4"
          bg="$background"
        >
          {bottomElement}
        </YStack>
      )}
    </>
  )

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
