import { Keyboard } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isWeb, Spinner, XStack, YStack } from 'tamagui'

import { isNative } from '~/constants/platform'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import Glint from '~/interface/effects/Glint'
import { Input } from '~/interface/forms/Input'
import { TextArea } from '~/interface/forms/TextArea'
import { PaperPlaneTiltIcon } from '~/interface/icons/phosphor/PaperPlaneTiltIcon'
import { KeyboardStickyFooter } from '~/interface/keyboard/KeyboardStickyFooter'

import type { User } from 'better-auth'

type AppUser = User & { role?: 'admin' }

interface CommentInputProps {
  user: AppUser | null
  content: string
  setContent: (value: string) => void
  handleSubmit: () => void
  isSubmitting: boolean
}

export function CommentInput({
  user,
  content,
  setContent,
  handleSubmit,
  isSubmitting,
}: CommentInputProps) {
  const { bottom } = useSafeAreaInsets()
  const hasContent = content.trim().length > 0
  const offset = -(bottom + 50)

  const onSubmit = () => {
    handleSubmit()
    Keyboard.dismiss()
  }

  if (!user) return null

  return (
    <>
      {isWeb && (
        <YStack gap="$2" pt="$2">
          <TextArea
            // @ts-expect-error size variant type issue in canary
            size="large"
            placeholder="Add a comment..."
            value={content}
            onChange={(e) => setContent((e.target as HTMLInputElement).value)}
            minH={60}
          />
          <XStack justify="flex-end">
            <ButtonSimple
              size="small"
              theme="accent"
              disabled={!content.trim() || isSubmitting}
              onPress={handleSubmit}
            >
              {isSubmitting ? <Spinner size="small" /> : 'Post'}
            </ButtonSimple>
          </XStack>
        </YStack>
      )}

      {isNative && (
        <KeyboardStickyFooter openedOffset={-10}>
          <XStack
            items="center"
            gap="$2"
            px="$3"
            py="$2"
            overflow="hidden"
            rounded={24}
            bg="$background"
            mx="$2"
          >
            <Glint rounded={24} />
            <Input
              flex={1}
              borderWidth={0}
              color="$color"
              placeholder="Add a comment..."
              value={content}
              onChange={(e) => setContent((e.target as HTMLInputElement).value)}
              maxLength={500}
              rows={3}
              multiple
              verticalAlign="top"
            />

            <YStack
              key="send-button"
              transition="200ms"
              scale={hasContent ? 1 : 0.5}
              opacity={hasContent ? 1 : 0}
            >
              <ButtonSimple
                size="large"
                circular
                bg="$color6"
                disabled={isSubmitting}
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
        </KeyboardStickyFooter>
      )}
    </>
  )
}
