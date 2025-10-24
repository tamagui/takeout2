import { useState } from 'react'
import { XStack, YStack } from 'tamagui'
import { ButtonAction } from '../buttons/ButtonAction'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { Input } from '../forms/Input'
import { confirmEmitter } from './actions'
import { Dialog } from './Dialog'
import { dialogLayer2Emitter } from './shared'
import type { DialogConfirmType } from './types'
import { useEmitter } from '@vxrn/helpers'

export const DialogConfirm = () => {
  const [state, setState] = useState<DialogConfirmType | null>(null)
  const [extraConfirm, setExtraConfirm] = useState<string | null>(null)

  useEmitter(dialogLayer2Emitter, (next) => {
    if (next.type === 'confirm') {
      setState(next)
    } else {
      setState(null)
    }
  })

  return (
    <Dialog
      minH={state?.extraConfirm ? 260 : 220}
      open={!!state}
      onOpenChange={(open) => {
        // Only handle closing, not opening
        if (!open && state) {
          setState(null)
          confirmEmitter.emit(false)
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
              confirmEmitter.emit(false)
              setState(null)
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

            confirmEmitter.emit(true)
            setState(null)
          }}
        >
          Confirm
        </ButtonAction>
      </XStack>
    </Dialog>
  )
}
