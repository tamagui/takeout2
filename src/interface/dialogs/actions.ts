import { AbortError, createEmitter, isEqualNever } from '@vxrn/helpers'
import { dialogEmit } from './shared'
import type { DialogConfirmType } from './types'

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
