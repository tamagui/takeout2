import { useEmitterSelector } from '@take-out/helpers'
import { useState } from 'react'
import { XStack, YStack } from 'tamagui'

import { signInAsAdmin } from '~/features/auth/client/signInAsAdmin'
import { useGoBackToHome } from '~/hooks/useGoBackToHome'

import { Button } from '../buttons/Button'
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
      <YStack pointerEvents="box-none" gap="$2" $md={{ flex: 1 }}>
        <Dialog.Header title="Admin Login" description="Enter password" />
        <Input
          type="password"
          onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
          placeholder="Password"
        />
      </YStack>

      <XStack pointerEvents="box-none" justify="flex-end" gap="$2">
        <Dialog.Close asChild>
          <Button onPress={closeDialog}>Cancel</Button>
        </Dialog.Close>

        <Button
          variant="action"
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
        </Button>
      </XStack>
    </Dialog>
  )
}
