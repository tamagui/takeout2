import { useState } from 'react'
import { XStack, YStack } from 'tamagui'
import { FinishTauriAppLoginButton } from '~/auth/ui/FinishTauriAppLoginButton'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { Dialog } from './Dialog'
import { useDialogEmit } from './shared'

export const DialogRedirectToTauri = () => {
  const [show, setShow] = useState(false)

  useDialogEmit((val) => {
    setShow(val.type === 'redirect-to-tauri')
  })

  return (
    <Dialog open={!!show} onOpenChange={setShow}>
      <YStack flex={1}>
        <Dialog.Header title="Login on Desktop" />

        <YStack
          flex={1}
          items="center"
          justify="center"
          onPressOut={() => {
            setShow(false)
          }}
        >
          <FinishTauriAppLoginButton />
        </YStack>
      </YStack>

      <XStack justify="flex-end" gap="$2">
        <Dialog.Close asChild>
          <ButtonSimple
            onPress={() => {
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
