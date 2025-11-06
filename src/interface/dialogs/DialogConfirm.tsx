import { useEmitterSelector } from '@vxrn/helpers'
import { useState } from 'react'
import { XStack, YStack } from 'tamagui'
import { ButtonAction } from '../buttons/ButtonAction'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { Input } from '../forms/Input'
import { confirmEmitter } from './actions'
import { Dialog } from './Dialog'
import { closeDialogLayer2, dialogLayer2Emitter } from './shared'

export const DialogConfirm = () => {
  const [extraConfirm, setExtraConfirm] = useState<string | null>(null)
  const state = useEmitterSelector(dialogLayer2Emitter, (next) => {
    if (next.type === 'confirm') {
      return next
    } else {
      return null
    }
  })

  const close = (accepted: boolean) => {
    confirmEmitter.emit(accepted)
    closeDialogLayer2()
  }

  return (
    <Dialog
      minH={state?.extraConfirm ? 260 : 220}
      open={!!state}
      onOpenChange={(open) => {
        if (open) return

        // Only handle closing, not opening
        if (!open && state) {
          close(false)
        }
      }}
    >
      <YStack pointerEvents="box-none" gap="$2" flex={1}>
        <Dialog.Header title={state?.title} description={state?.description} />

        {state?.extraConfirm && (
          <Input
            mt="$2"
            onChangeText={setExtraConfirm}
            placeholder='Type "Confirm" to confirm'
          />
        )}
      </YStack>

      <XStack pointerEvents="box-none" justify="flex-end" gap="$2">
        <Dialog.Close asChild>
          <ButtonSimple
            onPress={() => {
              close(false)
            }}
          >
            Cancel
          </ButtonSimple>
        </Dialog.Close>

        <ButtonAction
          onPress={() => {
            if (state?.extraConfirm && extraConfirm !== 'Confirm') {
              return
            }
            close(true)
          }}
        >
          Confirm
        </ButtonAction>
      </XStack>
    </Dialog>
  )
}
