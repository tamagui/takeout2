import { useState } from 'react'
import { XStack, YStack } from 'tamagui'
import { useUser } from '~/features/user/useUser'
import { LoginSignupContents } from '../../features/auth/ui/LoginSignupContents'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { Dialog } from './Dialog'
import { isSignedUpEmitter } from './isSignedUpEmitter'
import { useDialogEmit } from './shared'

export const DialogSignUp = () => {
  const { state } = useUser()
  const [show, setShow] = useState(false)

  useDialogEmit((next) => {
    setShow(next.type === 'signup')
  })

  if (state === 'logged-in' && show) {
    setShow(false)
  }

  return (
    <Dialog minH={300} open={!!show} onOpenChange={setShow}>
      <YStack flex={1}>
        <Dialog.Header title="Sign up" />

        <LoginSignupContents />
      </YStack>

      <XStack justify="flex-end" gap="$2">
        <Dialog.Close asChild>
          <ButtonSimple
            onPress={() => {
              isSignedUpEmitter.emit(false)
              setShow(false)
            }}
          >
            Cancel
          </ButtonSimple>
        </Dialog.Close>
      </XStack>
    </Dialog>
  )
}
