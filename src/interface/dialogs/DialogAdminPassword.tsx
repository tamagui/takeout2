import { useEmitterSelector } from '@tamatko/helpers'
import { useState } from 'react'
import { XStack, YStack } from 'tamagui'
import { signInAsAdmin } from '~/features/auth/client/signInAsAdmin'
import { useGoBackToHome } from '~/helpers/useGoBackToHome'
import { ButtonAction } from '../buttons/ButtonAction'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { Input } from '../forms/Input'
import { showToast } from '../toast/helpers'
import { Dialog } from './Dialog'
import { closeDialog, dialogEmitter } from './shared'

export const DialogAdminPassword = () => {
  const [password, setPassword] = useState('')
  const goHome = useGoBackToHome()
  const state = useEmitterSelector(dialogEmitter, (next) => {
    return next.type === 'admin-password' ? next : null
  })

  return (
    <Dialog
      open={!!state}
      onOpenChange={(open) => {
        if (!open) closeDialog()
      }}
    >
      <YStack pointerEvents="box-none" gap="$2" flex={1}>
        <Dialog.Header title="Admin Login" description="Enter password" />
        <Input onChangeText={setPassword} placeholder="Password" />
      </YStack>

      <XStack pointerEvents="box-none" justify="flex-end" gap="$2">
        <Dialog.Close asChild>
          <ButtonSimple onPress={closeDialog}>Cancel</ButtonSimple>
        </Dialog.Close>

        <ButtonAction
          onPress={async () => {
            const res = await signInAsAdmin(password)
            if (res.success) {
              closeDialog()
              showToast(`Signed in!`, { type: 'info' })
              goHome()
            } else {
              console.error(res.error)
              showToast(`Error!`, { type: 'error' })
            }
          }}
        >
          Confirm
        </ButtonAction>
      </XStack>
    </Dialog>
  )
}
