import { createEmitter, useEmitter } from '@o/helpers'
import { closeOpenTooltips } from 'takeout-ui/tooltip/closeOpenTooltips'
import type { DialogType } from './types'

export const dialogEmitter = createEmitter<DialogType>('dialog', {
  type: 'closed',
})

export const dialogEmit = (next: DialogType) => {
  closeOpenTooltips()
  dialogEmitter.emit(next)
}

export const useDialogEmit = (cb: (val: DialogType) => void) => useEmitter(dialogEmitter, cb)

export const closeDialog = () => {
  dialogEmitter.emit({ type: 'closed' })
}
