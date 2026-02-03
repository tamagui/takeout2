import { isWeb, useEmitterSelector } from '@take-out/helpers'
import { useState } from 'react'
import { useWindowDimensions, XStack, YStack } from 'tamagui'

import { Button } from '../buttons/Button'
import { Input } from '../forms/Input'
import { confirmEmitter } from './actions'
import { Dialog } from './Dialog'
import { closeDialogLayer2, dialogLayer2Emitter } from './shared'

export const DialogConfirm = () => {
  const { width } = useWindowDimensions()
  const minW = isWeb ? 450 : width * 0.9
  const [extraConfirm, setExtraConfirm] = useState('')
  const state = useEmitterSelector(dialogLayer2Emitter, (next) => {
    return next.type === 'confirm' ? next : null
  })

  const close = (accepted: boolean) => {
    confirmEmitter.emit(accepted)
    closeDialogLayer2()
  }

  return (
    <Dialog
      minH={state?.extraConfirm ? 260 : 220}
      minW={minW}
      open={!!state}
      onOpenChange={(open) => {
        if (open) return

        // Only handle closing, not opening
        if (!open && state) {
          close(false)
        }
      }}
    >
      <YStack pointerEvents="box-none" gap="$2" mb="$4" $md={{ flex: 1 }}>
        <Dialog.Header title={state?.title} description={state?.description} />

        {state?.extraConfirm && (
          <Input
            mt="$2"
            onChange={(e) => setExtraConfirm((e.target as HTMLInputElement).value)}
            placeholder='Type "Confirm" to confirm'
          />
        )}
      </YStack>

      <XStack pointerEvents="box-none" justify="flex-end" gap="$2">
        <Button
          onPress={() => {
            close(false)
          }}
        >
          Cancel
        </Button>

        <Button
          variant="action"
          onPress={() => {
            if (state?.extraConfirm && extraConfirm !== 'Confirm') {
              return
            }
            close(true)
          }}
        >
          Confirm
        </Button>
      </XStack>
    </Dialog>
  )
}
