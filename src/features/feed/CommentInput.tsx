import { Keyboard } from 'react-native'
import { isWeb, Spinner, XStack, YStack } from 'tamagui'

import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Input } from '~/interface/forms/Input'
import { TextArea } from '~/interface/forms/TextArea'
import { PaperPlaneTiltIcon } from '~/interface/icons/phosphor/PaperPlaneTiltIcon'
import { KeyboardStickyFooter } from '~/interface/keyboard/KeyboardStickyFooter'

import type { ReactNode } from 'react'
import type { User } from 'better-auth'

type AppUser = User & { role?: 'admin' }

function MaybeKeyboardStickyFooter({
  disabled,
  children,
}: {
  disabled: boolean
  children: ReactNode
}) {
  if (disabled) {
    return <>{children}</>
  }
  return <KeyboardStickyFooter openedOffset={-10}>{children}</KeyboardStickyFooter>
}

interface CommentInputProps {
  user: AppUser | null
  content: string
  setContent: (value: string) => void
  handleSubmit: () => void
  isSubmitting: boolean
  disableStickyFooter?: boolean
  keepKeyboardOpen?: boolean
}

export function CommentInput({
  user,
  content,
  setContent,
  handleSubmit,
  isSubmitting,
  disableStickyFooter = false,
  keepKeyboardOpen = false,
}: CommentInputProps) {
  const hasContent = content.trim().length > 0

  const onSubmit = () => {
    handleSubmit()
    if (!keepKeyboardOpen) {
      Keyboard.dismiss()
    }
  }

  if (!user) return null

  return (
    <>
      {isWeb && (
        <XStack gap="$3" maxW={600}>
          <YStack flex={1} position="relative">
            <TextArea
              size="large"
              placeholder="Write your comments here..."
              value={content}
              onChange={(e) => setContent((e.target as HTMLInputElement).value)}
            />
            <YStack
              position="absolute"
              b={12}
              r={12}
              transition="quick"
              scale={hasContent ? 1 : 0.8}
              opacity={hasContent ? 1 : 0.4}
            >
              <ButtonSimple
                size="large"
                circular
                theme="accent"
                disabled={!content.trim() || isSubmitting}
                onPress={handleSubmit}
              >
                {isSubmitting ? (
                  <Spinner size="small" color="$color" />
                ) : (
                  <PaperPlaneTiltIcon size={18} color="$color" />
                )}
              </ButtonSimple>
            </YStack>
          </YStack>
        </XStack>
      )}

      {process.env.VITE_NATIVE && (
        <MaybeKeyboardStickyFooter disabled={disableStickyFooter}>
          <XStack items="center" gap="$2" px="$3" py="$2" overflow="hidden" bg="$background">
            <Input
              unstyled
              flex={1}
              rounded={24}
              bg="$color2"
              color="$color"
              borderColor="$borderColor"
              placeholder="Add a comment..."
              value={content}
              onChange={(e) => setContent((e.target as HTMLInputElement).value)}
              maxLength={500}
              maxHeight={100}
              minH={44}
              maxH={100}
              rows={2}
              verticalAlign="top"
            />

            <YStack key="send-button">
              <ButtonSimple
                size="large"
                circular
                bg="$color6"
                disabled={isSubmitting || !content.trim()}
                onPress={onSubmit}
              >
                {isSubmitting ? (
                  <Spinner size="small" color="$color" />
                ) : (
                  <PaperPlaneTiltIcon size={18} color="$color" />
                )}
              </ButtonSimple>
            </YStack>
          </XStack>
        </MaybeKeyboardStickyFooter>
      )}
    </>
  )
}
