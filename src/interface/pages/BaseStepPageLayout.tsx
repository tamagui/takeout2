import { LinearGradient } from '@tamagui/linear-gradient'
import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EnsureFlexed, isWeb, YStack } from 'tamagui'

export const BaseStepPageLayout = ({
  children,
  bottom: bottomElement,
  disableScroll = true,
  linearGradientFooter = false,
  disableKeyboardAvoidingView = false,
  hideBackButton = false,
  keyboardOffset = 0,
}: {
  children: ReactNode
  bottom?: ReactNode
  disableScroll?: boolean
  linearGradientFooter?: boolean
  disableKeyboardAvoidingView?: boolean
  hideBackButton?: boolean
  keyboardOffset?: number
}) => {
  const { top, bottom } = useSafeAreaInsets()

  const content = (
    <>
      {isWeb ? (
        <YStack flex={1} items="center">
          <YStack width="100%" maxW={400} p="$2">
            {children}
            {bottomElement && <YStack pt="$4">{bottomElement}</YStack>}
          </YStack>
        </YStack>
      ) : (
        <ScrollView
          scrollEnabled={!disableScroll}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <YStack
            minW="100%"
            flex={1}
            pt={!hideBackButton ? top + 24 : 0}
            bg="$background"
            rounded="$6"
          >
            <YStack maxW={600} self="center" px={14}>
              <EnsureFlexed />
              {children}
            </YStack>
          </YStack>
        </ScrollView>
      )}

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
