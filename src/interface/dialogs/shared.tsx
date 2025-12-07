import { createEmitter, useEmitter } from '@take-out/helpers'

import { closeOpenTooltips } from '~/interface/tooltip/closeOpenTooltips'

import type { DialogLayer2, DialogType } from './types'

export const dialogEmitter = createEmitter<DialogType>('dialog', {
  type: 'closed',
})

export const dialogEmit = (next: DialogType | DialogLayer2) => {
  closeOpenTooltips()
  if (next.type === 'confirm' || next.type === 'error') {
    dialogLayer2Emitter.emit(next)
  } else if (next.type === 'closed') {
    // close in order
    if (dialogLayer2Emitter.value?.type !== 'closed') {
      dialogLayer2Emitter.emit(next)
    } else {
      dialogEmitter.emit(next)
    }
  } else {
    dialogEmitter.emit(next)
  }
}

export const useDialogEmit = (cb: (val: DialogType) => void) =>
  useEmitter(dialogEmitter, cb)

// to allow dialog on top of dialog for now just have two layers
export const dialogLayer2Emitter = createEmitter<DialogLayer2>('dialogConfirm', {
  type: 'closed',
})

export const closeDialogLayer2 = () => {
  dialogLayer2Emitter.emit({ type: 'closed' })
}

export const closeDialog = () => {
  dialogEmitter.emit({ type: 'closed' })
}
