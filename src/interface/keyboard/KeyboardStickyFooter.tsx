import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { YStack } from 'tamagui'

interface KeyboardStickyFooterProps {
  children: ReactNode
}

export const KeyboardStickyFooter = ({ children }: KeyboardStickyFooterProps) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <YStack
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        backgroundColor="$background"
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderTopWidth={1}
        borderTopColor="$borderColor"
      >
        {children}
      </YStack>
    </KeyboardAvoidingView>
  )
}

export default KeyboardStickyFooter
