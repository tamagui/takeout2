import { useEmitterSelector } from '@take-out/helpers'
import { isWeb, useWindowDimensions, XStack, YStack } from 'tamagui'

import { Button } from '../buttons/Button'
import { Dialog } from './Dialog'
import { closeDialogLayer2, dialogLayer2Emitter } from './shared'

export const DialogError = () => {
  const { width } = useWindowDimensions()
  const minW = isWeb ? 450 : width * 0.9
  const state = useEmitterSelector(dialogLayer2Emitter, (next) => {
    return next.type === 'error' ? next : null
  })

  const close = () => {
    closeDialogLayer2()
  }

  // Calculate dynamic height based on content length
  const descriptionLength = state?.description?.length || 0
  const minHeight = descriptionLength > 100 ? 240 : 200

  return (
    <Dialog
      minH={minHeight}
      minW={minW}
      open={!!state}
      onOpenChange={(open) => {
        if (open) return

        // Only handle closing, not opening
        if (!open && state) {
          close()
        }
      }}
    >
      <YStack pointerEvents="box-none" gap="$3" $md={{ flex: 1 }}>
        <Dialog.Header title={state?.title} description={state?.description} />
      </YStack>

      <XStack pointerEvents="box-none" justify="flex-end" gap="$2" mt="$3">
        <Dialog.Close asChild>
          <Button
            variant="action"
            theme="red"
            size="medium"
            onPress={() => {
              close()
            }}
          >
            {state?.dismissText || 'OK'}
          </Button>
        </Dialog.Close>
      </XStack>
    </Dialog>
  )
}
