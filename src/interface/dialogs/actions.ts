import { createEmitter } from '@vxrn/helpers'
import { AbortError } from '@vxrn/helpers'
import { isEqualNever } from '@vxrn/helpers'
import { dialogEmit } from './shared'
import type { DialogConfirmType, DialogCreateDataType } from './types'

export const dialogRedirectToTauri = async () => {
  dialogEmit({
    type: 'redirect-to-tauri',
  })
}

export const confirmEmitter = createEmitter<boolean>('confirm', false, {
  comparator: isEqualNever,
})

export type DialogConfirmProps = Partial<Omit<DialogConfirmType, 'type'>>

export const dialogConfirm = async (props: DialogConfirmProps) => {
  dialogEmit({
    type: 'confirm',
    title: `Are you sure?`,
    description: '',
    ...props,
  })
  return confirmEmitter.nextValue()
}

export const ensureConfirmed = async (props: DialogConfirmProps = {}) => {
  const confirmed = await dialogConfirm(props)
  if (!confirmed) {
    throw new AbortError()
  }
}

export const serverDialogEmitter = createEmitter<boolean>('serverDialog', false)

export const dialogCreateServer = async () => {
  dialogEmit({
    type: 'create-server',
  })
  return serverDialogEmitter.nextValue()
}

export const dialogJoinServer = async () => {
  dialogEmit({
    type: 'join-server',
  })
  return serverDialogEmitter.nextValue()
}

export const addFriendEmitter = createEmitter<boolean>('addFriend', false, {
  comparator: isEqualNever,
})

export const dialogAddFriend = async () => {
  dialogEmit({
    type: 'add-friend',
  })
  return addFriendEmitter.nextValue()
}

export const dataDialogEmitter = createEmitter<boolean>('dataDialog', false, {
  comparator: isEqualNever,
})

export const dialogCreateData = async (data: Omit<DialogCreateDataType, 'type'>) => {
  dialogEmit({
    type: 'create-data',
    ...data,
  })
  return dataDialogEmitter.nextValue()
}
