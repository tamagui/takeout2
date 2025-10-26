import { LinearGradient } from '@tamagui/linear-gradient'
import type { ReactNode } from 'react'
import { KeyboardAvoidingView, ScrollView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack } from 'tamagui'

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
      <ScrollView
        scrollEnabled={!disableScroll}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <YStack
          flex={1}
          pt={!hideBackButton ? top + 24 : 0}
        >
          {progressBar && progressBar.showProgressBar && (
            <YStack px="$4" py="$2">
              {/* Progress bar would go here */}
              <YStack height={4} bg="$color4" borderRadius="$2">
                <YStack
                  height={4}
                  bg="$color8"
                  borderRadius="$2"
                  width={`${(progressBar.currentStep / progressBar.totalSteps) * 100}%`}
                />
              </YStack>
            </YStack>
          )}
          <YStack flex={1} px={14}>
            {children}
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
      {bottomElement && (
        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
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